---
title: "CSM Outfeed Blank 감지 200ms 필터 적용 · Rev.1"
date: "2026-10-26"
excerpt: "Blank 감지를 200ms 확인한 뒤 인덱스를 시작하고, Blank가 센서를 벗어나면 바로 감지 확인을 해제한다. TIMER 태그 하나와 접점 세 곳을 수정한다."
kicker: PLC 변경안
tags: ["CSM", "PLC", "Outfeed", "Robot2"]
---

**Rev.1 · 2026-10-26.** Outfeed의 Blank 감지 입력이 짧게 바뀌면서 인덱스가 시작되는 증상에 대한 수정안이다. Blank가 놓였다는 신호가 연속 200ms 유지될 때만 자동 시작 조건으로 사용한다. Blank가 센서를 벗어나면 감지 확인을 바로 해제하고 다음 Blank를 기다린다.

**수정 범위는 CATHODE 1 PLC의 `Outfeed_Conveyor` 프로그램이다.** 로컬 TIMER 태그 하나를 만들고, `MainRoutine`에 렁 하나를 추가하며, `Background` 한 곳과 `Permits` 두 곳의 센서 접점을 바꾼다. SFC의 인덱스 순서와 R2 적재 허가 렁은 그대로 사용한다.

## 1. ON/OFF의 의미부터 구분한다

`i_sheet_not_at_conveyor`는 이름 그대로 “시트가 없음”을 나타내는 입력이다. 아래 극성은 기존 프로그램의 접점 사용을 기준으로 확인했다. 작업 전 실제 Blank 유무와 온라인 입력값이 같은지 대조한다.

| 현장 상태 | 원본 입력 | 새 타이머 완료 비트 |
|---|---|---|
| Blank가 없다. | `i_sheet_not_at_conveyor=1` | `timer_sheet_present_filter.DN=0` |
| Blank를 막 감지했다. | `i_sheet_not_at_conveyor=0` | 200ms 확인 중에는 0이다. |
| Blank 감지가 연속 200ms 유지됐다. | `i_sheet_not_at_conveyor=0` | 1이 되어 자동 시작 조건에 사용된다. |
| Blank가 이동해 센서를 벗어났다. | `i_sheet_not_at_conveyor=1` | 타이머가 다음에 실행될 때 0으로 초기화된다. |

여기서 **다음 Blank가 올 때까지 OFF로 기다리는 값은 새 타이머의 `.DN`과 인덱스 시작 조건**이다. 원본 센서 입력을 강제로 OFF시키는 방식이 아니다. Blank가 없을 때 원본 입력은 1이어야 한다.

동작 순서는 다음과 같다.

1. R2가 Blank를 내려놓기 전에는 원본 입력이 1이고, 타이머 완료 비트는 0이다.
2. Blank가 놓여 입력이 0으로 바뀌면 시간을 잰다. 중간에 1이 한 번이라도 PLC에서 읽히면 시간을 0부터 다시 잰다.
3. 200ms가 채워지고 기존 자동 시작 조건도 맞으면 `permit_start`가 발생한다. R2가 Outfeed에서 벗어났는지 확인하는 조건도 그대로 적용된다.
4. 시작한 인덱스는 기존 SFC 순서로 진행한다. Blank가 센서를 벗어나면 타이머 완료 비트는 0이 되지만, 이것으로 진행 중인 인덱스를 중간 정지시키지는 않는다.
5. 인덱스와 후속 동작이 끝난 뒤 다음 Blank를 기다린다. 센서 입력이 1인 동안은 Blank 감지에 의한 자동 시작이 나오지 않는다.

`.DN`은 한 스캔짜리 펄스가 아니다. Blank가 계속 감지되는 동안은 1을 유지하고, 기존 `ONS(permit_start_ons)`가 시작 펄스를 만든다. **센서가 0으로 고착되거나 잘못된 감지가 200ms 이상 지속되면 이 필터만으로 다음 Blank와 구분할 수 없다.** R2의 새 배출 완료 신호까지 확인하는 순서 제어는 이번 수정에 포함하지 않는다.

## 2. 짧은 신호가 인덱스를 시작시키는 위치

`Outfeed_Conveyor → Permits → 원본 Rung 0`은 자동 경로에서 `XIO(i_sheet_not_at_conveyor)`를 읽는다. 다른 허가 조건이 이미 맞아 있으면 짧은 입력 0도 시작 펄스로 바뀔 수 있다.

이 펄스는 `DoAutomatic`의 `Tran_B2` 조건인 `permit_start`에 전달된다. `State_Idle`에서 `State_Auto_Index`로 넘어가면 `Index`를 호출하고, `State_Index_1`의 시작 Action이 전진 출력을 켠다. 시작 후에는 센서가 다시 1로 돌아와도 SFC가 원래 위치로 자동 복귀하지 않는다.

원본은 `MainRoutine`에서 SFC를 먼저 실행하고 뒤에서 `Permits`를 실행한다. 따라서 `Permits`에서 만든 시작 펄스는 통상 다음 프로그램 스캔의 SFC에서 읽힌다. 이 호출 순서는 바꾸지 않는다.

## 3. 태그 하나를 만든다

Controller Organizer에서 **Tasks → MainTask → Outfeed_Conveyor → Parameters and Local Tags**를 연다. 버전에 따라 메뉴가 `Program Tags`로 표시될 수 있다. `Edit Tags`에서 다음 태그를 만든다.

| 항목 | 입력값 |
|---|---|
| Name | `timer_sheet_present_filter` |
| Scope | `Outfeed_Conveyor`의 로컬 태그 |
| Type / Data Type | Base / `TIMER` |
| Description | Outfeed Blank 감지 연속 200ms 확인, 시트 없음 입력에서 초기화 |

태그를 만든 뒤 `Monitor Tags`에서 `timer_sheet_present_filter.PRE=200`, `.ACC=0`을 확인한다. 새 태그의 `.EN`, `.TT`, `.DN`은 0으로 시작한다. HMI 버튼이나 HMI용 태그는 필요 없다. 이미 같은 이름이 있으면 새로 덮어쓰지 말고 사용처를 확인한다.

Rockwell의 TIMER는 1ms 단위이므로 PRE에 **200**을 넣는다. TON은 조건이 거짓이면 누적값과 완료 비트를 초기화한다. [Rockwell 공식 TON 설명](https://www.rockwellautomation.com/en-id/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/timer-and-counter-instructions/timer-on-delay--ton-.html)

## 4. MainRoutine 원본 Rung 4 다음에 타이머를 넣는다

위치는 **Outfeed_Conveyor → MainRoutine → 원본 Rung 4 바로 다음, 원본 Rung 5의 `JSR(Background,0);` 바로 앞**이다.

번호만 보지 말고 아래 기존 렁을 찾는다. Brush 동작이 끝났는지 확인해 `hb_single_cycle_complete`를 켜고, 수동 모드에서는 `Brush_Stop.X`를 해제하는 렁이다.

```text
XIC(Brush_Stop.X)[OTE(hb_single_cycle_complete),XIC(z_mode_manual)OTU(Brush_Stop.X)];
```

이 렁은 수정하지 않는다. 바로 아래에 새 렁 하나를 넣고 다음 Neutral Text를 입력한다.

```text
XIO(i_sheet_not_at_conveyor)TON(timer_sheet_present_filter,200,0);
```

<figure class="ld-rung" data-rung="5" data-rll="XIO(i_sheet_not_at_conveyor)TON(timer_sheet_present_filter,200,0);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / MainRoutine 추가 Rung 5</span><span class="rung-meta-description">Blank 감지 입력이 연속 200ms 유지되면 완료 비트를 켜고, Blank가 없어지면 초기화한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/filter.svg" alt="MainRoutine 추가 Rung 5 LD" width="1040">
</figure>

**새 렁의 왼쪽에 자동 모드, 수동 모드, 시작 펄스 또는 `.DN` 조건을 추가하지 않는다.** 프로그램이 실행될 때마다 타이머를 실행해야 센서가 돌아왔을 때 초기화된다. 이 타이머를 SFC의 특정 Step 안으로 옮기지 않는다.

| 삽입 전 | 삽입 후 |
|---|---|
| MainRoutine Rung 4: Brush 완료 처리 | Rung 4: 그대로 둔다. |
| 타이머 렁 없음 | Rung 5: 감지 확인 TON을 추가한다. |
| Rung 5: `JSR(Background,0);` | Rung 6으로 이동한다. |
| Rung 6: `JSR(Permits,0);` | Rung 7로 이동한다. |
| Rung 7: `JSR(Alarms,0);` | Rung 8로 이동한다. |

다른 Routine의 렁 번호는 바뀌지 않는다. 아래 세 군데는 각각 원래 번호로 찾으면 된다.

## 5. 센서 접점 세 곳을 바꾼다

세 곳 모두 아래와 같이 **XIO 접점을 XIC 접점으로 바꾸고 피연산자도 바꾼다.** 태그 이름만 바꾸고 XIO를 남겨두면 반대로 동작한다.

```text
변경 전: XIO(i_sheet_not_at_conveyor)
변경 후: XIC(timer_sheet_present_filter.DN)
```

아래 전체 렁은 비교와 입력 확인용이다. 현장에서는 해당 접점만 교체하면 나머지 분기와 타이머 설정을 유지할 수 있다. 공백은 정리했으며, Background의 기존 `timer_single_cycle`은 확인된 PRE 20000ms와 초기 ACC 0을 표시했다. **이 기존 타이머를 200ms로 바꾸지 않는다.** 현장 설정이 20000과 다르면 현장 값을 유지하고 센서 접점만 수정한다.

### 5-1. Background 원본 Rung 2: SM 비우기 요청의 감지 조건

수동 모드에서 단일 사이클을 만들고 `timer_single_cycle`을 실행하는 렁이다. 그 안에서 `z_ui_i_clear_stripping1`과 `z_ui_i_clear_stripping2`의 병렬 분기 뒤에 붙은 센서 접점을 찾는다.

#### 변경 전

```text
XIC(z_mode_manual)[[XIC(ui_i_single_cycle),XIC(ui_i_index),[XIC(z_ui_i_clear_stripping1),XIC(z_ui_i_clear_stripping2)]XIO(i_sheet_not_at_conveyor)][XIC(ui_o_ready),],XIC(single_cycle)]XIO(z_mode_estop)XIO(single_cycle_stop)[OTE(single_cycle),TON(timer_single_cycle,20000,0)];
```

<figure class="ld-rung" data-rung="2" data-rll="XIC(z_mode_manual)[[XIC(ui_i_single_cycle),XIC(ui_i_index),[XIC(z_ui_i_clear_stripping1),XIC(z_ui_i_clear_stripping2)]XIO(i_sheet_not_at_conveyor)][XIC(ui_o_ready),],XIC(single_cycle)]XIO(z_mode_estop)XIO(single_cycle_stop)[OTE(single_cycle),TON(timer_single_cycle,20000,0)];">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Background 원본 Rung 2</span><span class="rung-meta-description">수동 단일 사이클을 만들며, SM 비우기 요청은 필터 없는 Blank 감지 접점을 읽는다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/background-before.svg" alt="Background 원본 Rung 2 LD" width="1040">
</figure>

#### 변경 후

```text
XIC(z_mode_manual)[[XIC(ui_i_single_cycle),XIC(ui_i_index),[XIC(z_ui_i_clear_stripping1),XIC(z_ui_i_clear_stripping2)]XIC(timer_sheet_present_filter.DN)][XIC(ui_o_ready),],XIC(single_cycle)]XIO(z_mode_estop)XIO(single_cycle_stop)[OTE(single_cycle),TON(timer_single_cycle,20000,0)];
```

<figure class="ld-rung" data-rung="2" data-rll="XIC(z_mode_manual)[[XIC(ui_i_single_cycle),XIC(ui_i_index),[XIC(z_ui_i_clear_stripping1),XIC(z_ui_i_clear_stripping2)]XIC(timer_sheet_present_filter.DN)][XIC(ui_o_ready),],XIC(single_cycle)]XIO(z_mode_estop)XIO(single_cycle_stop)[OTE(single_cycle),TON(timer_single_cycle,20000,0)];">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Background 변경 후 Rung 2</span><span class="rung-meta-description">SM 비우기 요청의 Blank 감지만 200ms 확인하며, 직접 Index·Single Cycle 버튼과 자기유지는 그대로 둔다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/background-after.svg" alt="Background 변경 후 Rung 2 LD" width="1040">
</figure>

직접 누르는 `ui_i_single_cycle`, `ui_i_index` 버튼 경로와 `single_cycle` 자기유지 경로는 그대로다. 따라서 이 버튼으로 의도적으로 실행하는 수동 인덱스는 Blank가 없어도 기존 조건에 따라 가능하다.

### 5-2. Permits 원본 Rung 0: 자동 인덱스 시작

맨 앞에 `SBR()`가 있고, 마지막에 `ONS(permit_start_ons)OTE(permit_start)`가 있는 렁이다. 자동 경로에서 `z_System_Running.X` 바로 뒤의 센서 접점 하나를 바꾼다.

#### 변경 전

```text
SBR()[XIC(z_System_Running.X)XIO(i_sheet_not_at_conveyor)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);
```

<figure class="ld-rung" data-rung="0" data-rll="SBR()[XIC(z_System_Running.X)XIO(i_sheet_not_at_conveyor)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Permits 원본 Rung 0</span><span class="rung-meta-description">자동 운전 조건과 Blank 감지가 맞으면 시작 펄스를 만들며, single_cycle은 별도 병렬 경로다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/permit-before.svg" alt="Permits 원본 Rung 0 LD" width="1040">
</figure>

#### 변경 후

```text
SBR()[XIC(z_System_Running.X)XIC(timer_sheet_present_filter.DN)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);
```

<figure class="ld-rung" data-rung="0" data-rll="SBR()[XIC(z_System_Running.X)XIC(timer_sheet_present_filter.DN)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Permits 변경 후 Rung 0</span><span class="rung-meta-description">자동 경로는 200ms 확인된 Blank 감지를 읽고, 기존 로봇 이탈·원점 조건과 ONS를 그대로 적용한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/permit-after.svg" alt="Permits 변경 후 Rung 0 LD" width="1040">
</figure>

로봇 이탈, 원점, 그리퍼 열림, 리프트 상승, 후단 허가 조건과 별도 `single_cycle` 경로는 그대로다. 필터는 자동 시작을 늦출 뿐, 이 조건들을 대신하지 않는다.

### 5-3. Permits 원본 Rung 5: 센서 변화에 따른 다음 적재 허가 기억

끝에 `OTL(permit_cycle_after_unload)`가 있는 렁이다. 자동·수동 모드 병렬 접점 다음, `ONS(permit_cycle_after_unload_ons_3)` 바로 앞의 센서 접점을 바꾼다.

#### 변경 전

```text
[[XIC(State_Wait.X)ONS(permit_cycle_after_unload_ons_1),XIO(State_Auto_Index.X)XIC(z_permit_bcar_outfeed_run)ONS(permit_cycle_after_unload_ons_2)],[XIC(z_mode_manual),XIC(z_mode_automatic)]XIO(i_sheet_not_at_conveyor)ONS(permit_cycle_after_unload_ons_3)]ONS(permit_cycle_after_unload_complete_ons)OTL(permit_cycle_after_unload);
```

<figure class="ld-rung" data-rung="5" data-rll="[[XIC(State_Wait.X)ONS(permit_cycle_after_unload_ons_1),XIO(State_Auto_Index.X)XIC(z_permit_bcar_outfeed_run)ONS(permit_cycle_after_unload_ons_2)],[XIC(z_mode_manual),XIC(z_mode_automatic)]XIO(i_sheet_not_at_conveyor)ONS(permit_cycle_after_unload_ons_3)]ONS(permit_cycle_after_unload_complete_ons)OTL(permit_cycle_after_unload);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Permits 원본 Rung 5</span><span class="rung-meta-description">세 가지 경로 중 하나의 상승 조건으로 다음 적재를 위한 permit_cycle_after_unload를 래치한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/cycle-before.svg" alt="Permits 원본 Rung 5 LD" width="1040">
</figure>

#### 변경 후

```text
[[XIC(State_Wait.X)ONS(permit_cycle_after_unload_ons_1),XIO(State_Auto_Index.X)XIC(z_permit_bcar_outfeed_run)ONS(permit_cycle_after_unload_ons_2)],[XIC(z_mode_manual),XIC(z_mode_automatic)]XIC(timer_sheet_present_filter.DN)ONS(permit_cycle_after_unload_ons_3)]ONS(permit_cycle_after_unload_complete_ons)OTL(permit_cycle_after_unload);
```

<figure class="ld-rung" data-rung="5" data-rll="[[XIC(State_Wait.X)ONS(permit_cycle_after_unload_ons_1),XIO(State_Auto_Index.X)XIC(z_permit_bcar_outfeed_run)ONS(permit_cycle_after_unload_ons_2)],[XIC(z_mode_manual),XIC(z_mode_automatic)]XIC(timer_sheet_present_filter.DN)ONS(permit_cycle_after_unload_ons_3)]ONS(permit_cycle_after_unload_complete_ons)OTL(permit_cycle_after_unload);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Permits 변경 후 Rung 5</span><span class="rung-meta-description">센서 경로만 200ms 확인 후 래치하고, State_Wait와 기존 배출 허가 경로는 그대로 둔다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/cycle-after.svg" alt="Permits 변경 후 Rung 5 LD" width="1040">
</figure>

이 렁에도 필터를 적용해야 짧은 감지 신호가 허가 기억에 남는 경로를 함께 줄일 수 있다. `State_Wait.X` 경로와 `z_permit_bcar_outfeed_run` 경로는 기존대로 허가를 만들 수 있다. 이 비트 전체가 반드시 200ms를 기다린다는 뜻은 아니다.

## 6. R2 적재 허가와 SFC는 그대로 둔다

**Permits 원본 Rung 3의 `XIC(i_sheet_not_at_conveyor)`는 바꾸지 않는다.** Blank가 없는 자리인지 확인하고 다음 Blank를 놓도록 허가하는 접점이다. 여기에 감지 확인 타이머의 `.DN`을 넣으면 Blank가 있을 때 적재를 허가하는 잘못된 조건이 된다.

```text
[XIO(State_Auto_Index.X)XIC(z_mode_automatic),XIC(z_mode_manual)]XIO(o_conveyor_forward)XIC(i_index_wheel_home)XIC(i_sheet_not_at_conveyor)XIC(permit_cycle_after_unload)OTE(z_permit_outfeed_r2_load);
```

<figure class="ld-rung" data-rung="3" data-rll="[XIO(State_Auto_Index.X)XIC(z_mode_automatic),XIC(z_mode_manual)]XIO(o_conveyor_forward)XIC(i_index_wheel_home)XIC(i_sheet_not_at_conveyor)XIC(permit_cycle_after_unload)OTE(z_permit_outfeed_r2_load);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Permits 원본 Rung 3 · 변경 없음</span><span class="rung-meta-description">Blank가 없고 컨베이어 정지·원점·기존 허가 조건이 맞으면 R2 적재를 허용한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/load-unchanged.svg" alt="Permits 원본 Rung 3 · 변경 없음 LD" width="1040">
</figure>

감지 필터는 Blank가 있음을 확인하는 데만 사용한다. R2 적재 허가 쪽의 짧은 ON 변동까지 제거하는 수정은 아니다. 이번 증상은 빈 자리에서 짧은 OFF가 자동 인덱스를 여는 경로를 대상으로 한다.

`DoAutomatic`과 `Index`의 Step, Transition, Action은 수정하지 않는다. Blank가 이동해 타이머 완료 비트가 꺼져도 이미 시작한 인덱스는 기존 `i_index_wheel_slowdown`, `i_index_wheel_home`과 시간 조건에 따라 끝난다. 전진 출력에 필터 완료 접점을 직접 직렬로 넣으면 이동 중 Blank가 센서를 벗어나는 순간 멈출 수 있으므로 그렇게 연결하지 않는다.

## 7. 적용 순서

1. 설비를 정지시키고 현재 PLC 프로그램을 별도로 보관한다. 위에 적힌 원본 세 렁과 MainRoutine 호출 순서가 현장 프로그램과 같은지 확인한다.
2. Blank가 없는 상태에서 입력 1, Blank가 있는 상태에서 입력 0인지 확인한다. 극성이 다르면 이 수정안을 그대로 입력하지 않는다.
3. 로컬 TIMER 태그를 만들고 PRE 200을 설정한다.
4. MainRoutine 원본 Rung 4 다음에 새 TON 렁을 추가한다. 원본 Background 호출보다 위인지 확인한다.
5. Background Rung 2, Permits Rung 0·5의 접점 세 곳을 교체한다. `XIC(timer_sheet_present_filter.DN)`인지 확인한다.
6. Routine과 Controller의 Verify를 실행해 오류를 확인한다. Online Edit를 사용한다면 Test Edits 후 아래 상태를 확인하고 적용을 확정한다.
7. 빈 자리 대기, 한 장 적재, 인덱스 완료, 다음 장 적재 순서로 시험한다. 다른 운전자가 수동 Index를 누르지 않는 조건에서 자동 대기를 먼저 확인한다.

## 8. 모니터링과 합격 기준

한 Trend에 아래 여덟 항목을 넣는다. 로컬 태그는 `Outfeed_Conveyor` 범위에서 선택하고, 마지막 태그는 Controller 범위에서 선택한다.

| 태그 | 종류 | 확인할 내용 |
|---|---|---|
| `i_sheet_not_at_conveyor` | 디지털 | 짧은 0 입력과 실제 Blank 감지를 구분한다. |
| `timer_sheet_present_filter.ACC` | 아날로그 | 감지가 연속일 때만 200까지 올라간다. |
| `timer_sheet_present_filter.DN` | 디지털 | 200ms 확인 후 켜지고 시트 없음에서 꺼진다. |
| `permit_start` | 디지털 | 기존 허가 조건까지 맞은 시점에 시작 펄스가 나온다. |
| `State_Auto_Index.X` | 디지털 | 시작 펄스 다음에 인덱스 Step으로 들어간다. |
| `o_conveyor_forward` | 디지털 | SFC가 기존 순서대로 전진을 제어한다. |
| `single_cycle` | 디지털 | 센서와 별개인 수동 시작 경로가 켜졌는지 확인한다. |
| `z_permit_robot_clear_of_outfeed` | 디지털 | R2가 이탈한 뒤에만 시작되는지 확인한다. |

가능하면 Trend 간격을 10~20ms로 설정하되 실제 저장 가능한 간격을 확인한다. 짧은 시작 펄스나 입력 변화는 Trend 샘플 사이에서 빠질 수 있으므로, 기록에 보이지 않는다는 이유만으로 발생하지 않았다고 판단하지 않는다.

| 시험 조건 | 확인할 결과 |
|---|---|
| 빈 자리에서 입력 1 유지 | ACC와 DN은 0이고, 감지에 의한 자동 인덱스는 없다. |
| PLC가 읽은 입력 0이 50·100·150ms 후 1로 복귀 | DN은 켜지지 않고 ACC는 초기화된다. |
| 입력 0이 반복되지만 매번 200ms 전에 1이 읽힘 | 시간이 누적되지 않는다. |
| 입력 0이 연속 200ms 이상 유지 | DN이 켜진다. 다른 시작 조건이 맞아야 인덱스가 시작된다. |
| 감지 확인 완료 후 R2가 아직 이탈하지 않음 | DN이 켜져 있어도 시작 허가는 나오지 않는다. |
| 인덱스 중 Blank가 센서를 벗어남 | DN은 초기화되고 진행 중인 인덱스는 기존 순서로 완료된다. |
| 인덱스 완료 후 다음 Blank가 오지 않음 | 입력 1, DN 0을 유지하며 자동 재시작하지 않는다. |
| R2가 다음 Blank를 놓음 | 다시 200ms 확인한 뒤 다음 인덱스를 시작한다. |

200ms는 PLC에서 관측한 입력에 대한 확인 시간이다. 입력 모듈 갱신과 프로그램 스캔 때문에 실제 시작 시각에는 차이가 생긴다. 스캔 사이에서 끝난 짧은 반대 신호는 프로그램이 보지 못할 수 있다. 또한 실제 Blank 감지 시간 자체가 200ms보다 짧다면 정상 적재도 확인하지 못하므로 시험에서 감지 지속시간을 함께 본다.

## 9. 검증 범위와 복구

원본 프로그램의 직접 사용처 네 곳을 확인했고, 감지 없음으로 R2 적재를 허용하는 한 곳은 유지했다. 아래 모의시험은 TON의 감지 지연·초기화와 시작 조건의 대표 경로를 확인한다. 실제 Controller의 스캔 시간과 I/O 통신, 로봇 동작까지 실행하는 에뮬레이터는 아니다.

**작성 시 모의시험 11개 항목이 통과했다.** 짧은 감지 펄스 차단, 감지 해제 시 초기화, 기존 인터록 유지, 두 장을 차례로 적재했을 때 시작 두 번, 빈 자리 대기를 확인했다. 센서가 감지 상태로 고착되면 재시작할 수 있다는 필터의 한계도 시험에 포함했다. 변경 전·후 LD 8개는 기존 렌더러에서 파싱 경고 없이 변환됐으며, 현장 Controller의 Verify와 실제 운전 시험은 별도로 필요하다.

[모의시험 스크립트 다운로드](/downloads/csm-outfeed-sheet-filter/verify.mjs)

```sh
node verify.mjs
```

복구할 때는 세 곳의 `XIC(timer_sheet_present_filter.DN)`을 각각 원래의 `XIO(i_sheet_not_at_conveyor)`로 되돌린다. 그 뒤 추가한 TON 렁을 제거하고, Cross Reference에서 더 이상 참조되지 않는 것을 확인한 다음 새 TIMER 태그를 삭제한다. R2 적재 허가 렁과 SFC에는 복구할 변경이 없다.
