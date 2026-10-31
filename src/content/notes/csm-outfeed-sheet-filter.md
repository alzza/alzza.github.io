---
title: "CSM Outfeed Blank 감지와 인덱스 동작 점검 · Rev.6"
date: "2026-10-26"
excerpt: "실제 Trend의 Blank 감지와 DN 변화, Index Wheel 센서와 체인 인덱스 순서를 정리한다."
redirect: /notes/csm-outfeed-interactive.html
kicker: PLC 변경안
tags: ["CSM", "PLC", "Outfeed", "Robot2"]
---

**Rev.4 · 2026-10-29.** 현장 경과를 기록하고 Index Wheel과 밸브 시간의 역할을 추가했다. Rev.3의 200ms 모의 Trend는 비교 기록으로 보존했다.

| 현장 경과 | 확인된 내용 |
|---|---|
| 200ms | 채터링 때문에 타이머 완료 비트 `DN`이 켜지는 현상이 있었다. |
| 600ms | 필터 시간을 600ms로 바꾼 뒤에도 빈 칸이 생기는 현상이 한 번 발생했다. 감지 신호가 실제로 몇 ms 유지됐는지는 아직 기록이 없다. |
| 현재 2초 | 현장에서 필터를 2초로 설정했다는 작업자 설명이다. 적용 후 추가 발생 여부와 PLC Online 값은 확인 중이다. |

필터를 2초로 설정하면 `timer_sheet_present_filter.PRE=2000`이다. 아래 최초 작업안의 200ms 계산과 시험 그래프는 **이전 조건의 기록**이며 현재 2초 설정의 검증 결과가 아니다. 감지 신호가 2초 이상 계속되면 필터는 정상 감지로 받아들인다. 2초를 적용해도 모든 원인이 해결됐다고 단정할 수는 없다.

**Rev.3 · 2026-10-26.** Rev.2의 논리 모의시험 결과를 검은 배경의 Trend 형식 그래프로 덧붙였다. 차트는 10ms 간격을 가정한 계산 결과이며, PLC에서 수집한 실제 Trend가 아니다.

수정 범위는 **컨베이어 자동 인덱스 시작 조건 한 곳**이다. Rev.1의 Background Rung 2와 Permits Rung 5 변경 지시는 취소한다.

R2가 Blank를 내려놓을 때 Blank가 휘청거리거나 충격이 전달되면서 감지부를 순간적으로 건드린다. 이전 인덱스가 끝난 뒤 이 신호로 한 번 더 인덱스하면 체인에 Blank 한 장이 빠진 빈 칸이 생긴다. 정상 상태에서는 **R2가 내려놓을 자리가 비어 있고, 그 자리의 센서는 Blank를 감지하지 않은 채 대기**해야 한다.

이번 수정은 짧은 감지 신호로 추가 인덱스가 시작되는 것을 막는 필터다. **로컬 TIMER 태그 하나와 TON 렁 하나를 추가하고, Permits Rung 0의 센서 접점 하나만 교체한다.** 새 래치나 로봇 배출 완료 기억은 만들지 않는다.

## 1. Blank 감지 필터의 작동 방식

원본 프로그램에서는 `i_sheet_not_at_conveyor=0`이 Blank 감지이고, `=1`이 Blank 없음이다. 센서가 감지했다는 표현과 태그의 ON/OFF를 구분해야 한다.

| 상태 | 원본 입력 | 필터 동작 |
|---|---|---|
| R2 적재 위치가 비어 있다. | `i_sheet_not_at_conveyor=1` | ACC와 DN을 0으로 두고 기다린다. |
| 흔들림으로 잠깐 감지됐다. | 입력이 잠깐 0이 됐다가 1로 돌아온다. | 설정 시간 전에 돌아오면 확인을 취소하고 초기화한다. |
| Blank가 정상적으로 놓였다. | 입력 0이 설정 시간 동안 유지된다. | DN이 켜진다. 기존 시작 허가도 맞으면 인덱스를 시작한다. |
| 인덱스하면서 Blank가 센서를 벗어났다. | 입력이 1로 돌아온다. | 다음 타이머 실행에서 DN과 ACC를 0으로 초기화한다. |

인덱스가 끝나면 적재 위치가 다시 비어 다음 Blank를 기다린다. 현재 설정이 2초라면 2초 미만의 연속 감지는 시작 조건의 DN을 켜지 않는다. 진행 중인 인덱스는 기존 SFC 순서대로 끝난다.

변경 전 `Outfeed_Conveyor → Permits → Rung 0`의 `XIO(i_sheet_not_at_conveyor)`가 감지 조건이다. 다른 허가가 맞아 있으면 짧은 입력 0도 `ONS(permit_start_ons)`를 거쳐 `permit_start` 펄스가 될 수 있다. `DoAutomatic`의 `Tran_B2`가 이 펄스를 받아 `State_Auto_Index`로 넘어가므로, 이미 시작한 뒤 입력이 복귀해도 인덱스는 진행된다. **시작 전 감지 조건만** 타이머 확인으로 바꾼다.

## 2. 로컬 TIMER 태그 하나를 만든다

CATHODE 1 PLC에서 **Tasks → MainTask → Outfeed_Conveyor → Parameters and Local Tags**를 연다. 버전에 따라 `Program Tags`로 표시될 수 있다. `Edit Tags`에서 다음 태그를 만든다.

| 항목 | 입력값 |
|---|---|
| Name | `timer_sheet_present_filter` |
| Scope | `Outfeed_Conveyor` 로컬 |
| Type / Data Type | Base / `TIMER` |
| Description | Outfeed 자동 인덱스 시작용 Blank 감지 필터 |

현재 작업자 설명에 따른 설정은 `.PRE=2000`이다. 이미 적용한 태그와 TON 명령의 Preset이 Online에서 2000인지 확인한다. 새 태그의 초기 `.ACC`, `.EN`, `.TT`, `.DN`은 0이다. 이미 만든 태그가 있으면 같은 태그를 사용한다.

TON은 조건이 참인 동안 시간을 재며, 거짓이 되면 ACC와 DN을 초기화한다. TIMER의 시간 단위는 1ms이므로 **PRE 2000은 2초**다. [Rockwell 공식 TON 설명](https://www.rockwellautomation.com/en-id/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/timer-and-counter-instructions/timer-on-delay--ton-.html)

## 3. MainRoutine 원본 Rung 4 바로 다음에 TON을 추가한다

위치는 **Outfeed_Conveyor → MainRoutine → 원본 Rung 4 다음, 원본 Rung 5의 `JSR(Background,0);` 앞**이다. 아래 Brush 완료 처리 렁을 찾는다. `Brush_Stop.X`로 완료 비트를 켜고, 수동 모드에서 Brush 종료 상태를 해제하는 렁이다.

```text
XIC(Brush_Stop.X)[OTE(hb_single_cycle_complete),XIC(z_mode_manual)OTU(Brush_Stop.X)];
```

그 바로 아래에 새 렁 하나를 넣는다. Brush 완료 처리 렁에 TON을 붙이지 않고 **별도 렁으로 추가**한다.

```text
XIO(i_sheet_not_at_conveyor)TON(timer_sheet_present_filter,2000,0);
```

<figure class="ld-rung" data-rung="5" data-rll="XIO(i_sheet_not_at_conveyor)TON(timer_sheet_present_filter,2000,0);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / MainRoutine 추가 Rung 5</span><span class="rung-meta-description">Blank 감지가 연속 2초 유지되면 완료 비트를 켜고, 감지가 해제되면 초기화한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/filter-2s.svg" alt="MainRoutine 추가 Rung 5, 2초 TON LD" width="1040" height="176">
</figure>

이 TON은 매 프로그램 스캔마다 실행한다. 왼쪽에 시작 펄스나 자동 모드 조건을 덧붙이지 않는다. 입력이 1로 돌아왔을 때도 타이머가 실행돼야 초기화된다.

| MainRoutine 기존 위치 | 삽입 후 위치 |
|---|---|
| Rung 4: Brush 완료 처리 | Rung 4 그대로다. |
| 추가할 TON | 새 Rung 5가 된다. |
| Rung 5: `JSR(Background,0);` | Rung 6이 된다. |
| Rung 6: `JSR(Permits,0);` | Rung 7이 된다. |
| Rung 7: `JSR(Alarms,0);` | Rung 8이 된다. |

`Permits` 안의 렁 번호는 바뀌지 않는다. Rev.1대로 TON을 이미 추가했다면 다시 추가하지 않는다.

## 4. Permits 원본 Rung 0의 접점 하나만 바꾼다

**Outfeed_Conveyor → Permits → Rung 0**을 연다. 맨 앞에 `SBR()`가 있고, 마지막에 `ONS(permit_start_ons)OTE(permit_start)`가 있는 자동 시작 허가 렁이다.

자동 경로에서 **`XIC(z_System_Running.X)` 바로 뒤에 있는 센서 접점**을 다음과 같이 교체한다.

```text
변경 전: XIO(i_sheet_not_at_conveyor)
변경 후: XIC(timer_sheet_present_filter.DN)
```

XIO를 XIC로 바꾸는 것까지 포함한다. 아래는 공백만 정리한 전체 원본과 변경 후 로직이다.

### 변경 전

```text
SBR()[XIC(z_System_Running.X)XIO(i_sheet_not_at_conveyor)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);
```

<figure class="ld-rung" data-rung="0" data-rll="SBR()[XIC(z_System_Running.X)XIO(i_sheet_not_at_conveyor)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Permits 원본 Rung 0</span><span class="rung-meta-description">자동 운전 조건과 Blank 감지가 맞으면 시작 펄스를 만들며, single_cycle은 별도 병렬 경로다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/permit-before.svg" alt="Permits 원본 Rung 0 LD" width="1040">
</figure>

### 변경 후

```text
SBR()[XIC(z_System_Running.X)XIC(timer_sheet_present_filter.DN)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);
```

<figure class="ld-rung" data-rung="0" data-rll="SBR()[XIC(z_System_Running.X)XIC(timer_sheet_present_filter.DN)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);">
<div class="rung-meta"><span class="rung-meta-number">Outfeed_Conveyor / Permits 변경 후 Rung 0</span><span class="rung-meta-description">자동 경로는 설정 시간 동안 확인된 Blank 감지를 읽고, 기존 로봇 이탈·원점 조건과 ONS를 그대로 적용한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-outfeed-sheet-filter/permit-after.svg" alt="Permits 변경 후 Rung 0 LD" width="1040">
</figure>

R2 이탈, 그리퍼 열림, 리프트 상승, 원점과 후단 허가는 기존대로 적용한다. 별도 `single_cycle` 병렬 경로도 그대로다. 필터 접점을 `o_conveyor_forward` 출력에 직접 붙이지 않는다. 그렇게 하면 이동 중 Blank가 센서를 벗어날 때 전진을 끊게 된다.

## 5. 나머지 렁은 원본을 유지한다

| 위치 | 유지할 내용 |
|---|---|
| Background Rung 2 | 수동 단일 사이클 렁의 `XIO(i_sheet_not_at_conveyor)`를 그대로 둔다. |
| Permits Rung 5 | `OTL(permit_cycle_after_unload)`가 있는 렁의 `XIO(i_sheet_not_at_conveyor)`를 그대로 둔다. |
| Permits Rung 3 | R2 적재 허가의 `XIC(i_sheet_not_at_conveyor)`를 그대로 둔다. |
| DoAutomatic / Index | SFC의 Step, Transition, Action을 그대로 둔다. |

**Rev.1을 이미 적용했다면**, 아래 두 곳만 원래 접점으로 복구한다. 새로 작업하는 경우에는 이 두 렁을 수정하지 않는다.

| 복구할 위치 | Rev.1에서 바꾼 접점 | 원래대로 복구할 접점 |
|---|---|---|
| Background Rung 2: SM 비우기 요청 분기 뒤 | `XIC(timer_sheet_present_filter.DN)` | `XIO(i_sheet_not_at_conveyor)` |
| Permits Rung 5: `ONS(permit_cycle_after_unload_ons_3)` 바로 앞 | `XIC(timer_sheet_present_filter.DN)` | `XIO(i_sheet_not_at_conveyor)` |

이 복구는 기존 수동·적재 허가 로직을 되돌리는 작업이다. 새 래치나 해제 조건을 추가하지 않는다. 복구가 끝나면 새 타이머의 `.DN`을 읽는 접점은 **Permits Rung 0 한 곳**이어야 한다.

## 6. 적용 후에는 추가 인덱스가 사라졌는지 확인한다

설비 정지 상태에서 원본 렁과 입력 극성을 대조한 뒤 태그 생성, TON 추가, 접점 교체 순서로 작업한다. Routine과 Controller의 Verify를 실행하고, 온라인 편집을 사용하면 Test Edits에서 아래 동작을 확인한 뒤 적용을 확정한다.

| 시험 | 확인할 결과 |
|---|---|
| 적재 위치가 빈 상태로 대기 | 입력 1, ACC 0, DN 0을 유지한다. |
| Blank를 정상 적재 | 감지가 연속 2초 유지되고 기존 허가가 맞으면 한 번 인덱스한다. |
| 인덱스 후 빈 자리에서 2초 미만 순간 감지 | DN이 켜지지 않으며 추가 인덱스를 시작하지 않는다. |
| 짧은 감지가 여러 번 반복 | 감지 사이에 입력 1이 읽힐 때마다 ACC가 초기화된다. |
| 다음 Blank를 정상 적재 | 다시 2초 확인 후 인덱스한다. |

Trend에는 아래 다섯 개면 필터 전후를 비교할 수 있다. 모두 `Outfeed_Conveyor`의 로컬 태그다.

| 태그 | 종류 | 확인 목적 |
|---|---|---|
| `i_sheet_not_at_conveyor` | 디지털 | 순간 감지가 얼마나 지속되는지 본다. |
| `timer_sheet_present_filter.ACC` | 아날로그 | 확인 시간이 2000ms 전에 초기화되는지 본다. |
| `timer_sheet_present_filter.DN` | 디지털 | 짧은 감지에서 켜지지 않는지 본다. |
| `permit_start` | 디지털 | 추가 시작 펄스가 나오는지 본다. |
| `State_Auto_Index.X` | 디지털 | 실제 인덱스 Step 진입을 확인한다. |

가능하면 10~20ms 간격으로 기록한다. 한 스캔짜리 시작 펄스는 Trend에서 빠질 수 있으므로 Step 진입도 함께 본다. 현재 설정이 2000이면 감지가 **연속 2초 이상** 유지될 때 DN이 켜진다. 실제 감지 지속시간과 로봇 대기 시간도 확인한다.

## 7. 이전 200ms 모의시험과 복구

이 시험은 200ms 적용안의 과거 모델이다. 현장의 600ms·2초 설정을 시험한 결과가 아니다.

모의시험은 **정상 한 장 적재 → 인덱스 → 빈 자리에서 100ms 순간 감지 → 다음 장 적재** 순서를 포함한다. 시작 조건의 다른 허가가 맞아 있다는 가정에서 원본은 순간 감지로 추가 인덱스를 시작하고, 수정안은 그 순간 감지를 걸러낸다. 실제 PLC·로봇 전체를 실행하는 에뮬레이터는 아니며, 입력이 프로그램에서 읽혔다는 가정의 논리 시험이다.

아래 그래프는 그 입력 시나리오를 2.4초 동안 10ms 간격으로 계산해 표시했다. 첫 Blank 감지는 100~400ms, 충격으로 인한 순간 감지는 900~1000ms, 다음 Blank 감지는 1500~1800ms로 설정했다. 인덱스 동작은 비교를 위해 400ms라고 가정했다. 원본은 110ms, 910ms, 1510ms에 시작하고, 필터안은 310ms와 1710ms에 시작한다. 그래서 이 모델에서는 시작 횟수가 원본 3회, 필터안 2회다.

<figure>
  <img src="/images/notes/csm-outfeed-sheet-filter/logic-model-trend.svg" alt="실측이 아닌 논리 모의시험 Trend. 입력, TON 누적값과 완료 비트, 원본 및 필터안 시작 펄스와 인덱스 상태를 비교한다." width="1040" height="700" loading="lazy">
  <figcaption>논리 모의시험 데이터 · 가로축은 경과 시간이다. PLC Trend 기록이 아니며, 실제 센서 신호의 지속시간과 인덱스 시간은 현장에서 확인해야 한다.</figcaption>
</figure>

| 논리 시험 신호 | 모의 데이터에서 보이는 변화 |
|---|---|
| `i_sheet_not_at_conveyor` | 첫 적재 때 300ms 동안 0, 충격 때 100ms 동안 0, 다음 적재 때 300ms 동안 0이다. |
| `timer_sheet_present_filter.ACC` | 첫·다음 적재 때 200까지 올라간다. 100ms 충격 구간에서는 100까지만 올라갔다가 초기화된다. |
| `timer_sheet_present_filter.DN` | 첫 감지에서 300~400ms, 다음 감지에서 1700~1800ms 동안 1이다. 충격 구간에는 켜지지 않는다. |
| `permit_start` | 모델의 기존 허가 조건을 모두 참으로 두면 원본은 3회, 필터안은 2회 시작한다. |
| `State_Auto_Index.X` | 비교를 위해 각 시작 뒤 400ms 동안 켜진다고 가정했다. 실제 SFC 시간은 반영하지 않았다. |

위 시각은 그래프와 검증 스크립트가 같은 10ms 샘플 계산에서 만든 값이다. **이 표와 그림은 실제 PLC 측정치처럼 보이도록 만든 형식일 뿐, 현장 기록으로 해석하면 안 된다.**

[모의시험 스크립트 다운로드](/downloads/csm-outfeed-sheet-filter/verify.mjs)

```sh
node verify.mjs
```

필터를 완전히 원복하려면 **Permits Rung 0 한 곳**의 `XIC(timer_sheet_present_filter.DN)`을 `XIO(i_sheet_not_at_conveyor)`로 되돌린다. 추가한 TON 렁을 제거하고, 참조가 없음을 확인한 뒤 TIMER 태그를 삭제한다.

## 8. 체인이 한 칸 이동하는 순서

아래 설명은 확인한 `Outfeed_Conveyor`의 `DoAutomatic`과 `Index` SFC를 기준으로 작성했다. 현장에서 현재 동작 중인 프로그램과 설정값을 Online에서 대조해야 한다. 로봇 위치, 체인 길이, 실제 밸브 응답 시간과 이동 거리는 이 설명만으로 확정할 수 없다.

**R2가 내려놓는 자리에는 Blank가 없어야 한다.** 정상 흐름은 R2가 Blank를 내려놓고 이탈한 후 센서가 Blank를 감지하고, 시작 허가가 맞으면 체인이 한 칸 이동해 다시 빈 자리를 만드는 것이다. 여기서 Blank 감지 필터는 **시작 전의 감지 확인**을 담당하고, Index Wheel의 두 센서는 **시작한 뒤 감속 위치와 원점 위치를 확인**한다.

### 자동 사이클과 Index SFC의 연결

| 순서 | 프로그램 위치 | 조건과 동작 |
|---|---|---|
| 1. 시작 대기 | `Permits → Rung 0` | 자동 경로에서 `timer_sheet_present_filter.DN`, 후단 허가, 리프트·그리퍼·Idle 상태 등 기존 조건을 확인한다. R2 이탈과 `interlock_home`도 만족하면 `permit_start` 펄스를 만든다. `single_cycle`은 별도 병렬 경로다. |
| 2. Index 진입 | `DoAutomatic → Tran_B2 → State_Auto_Index` | `permit_start`로 Step에 진입하면 `Index`를 초기화하고 호출한다. |
| 3. 연속 전진 | `Index → State_Index_1` | Step 진입 Action에서 `o_conveyor_forward := z_permit_robot_clear_of_outfeed`를 실행한다. `i_index_wheel_slowdown`을 기다린다. |
| 4. 감속 위치 감지 | `Index → Tran_000 → State_Valve_Response` | `i_index_wheel_slowdown=1`이면 `State_Index_1`을 벗어난다. 그 Step의 종료 Action은 전진 출력을 0으로 쓴다. 이어서 밸브 응답 대기 Step으로 들어간다. |
| 5. 밸브 응답 대기 | `Index → State_Valve_Response` | 이 Step의 Preset은 `param_valve_delay_time`이다. Step의 시간이 Preset에 도달해 `.DN=1`이 되면 `Tran_006`으로 다음 Step에 간다. |
| 6. 원점 찾기 | `Index → State_Bump_Valve` | Step 진입 Action에서 `o_conveyor_forward := z_permit_robot_clear_of_outfeed`를 실행한다. Home이 켜지면 `Tran_007`을 통과한다. Home이 꺼진 채 Step의 `.DN`이 켜지면 `Tran_019`를 거쳐 같은 Step으로 돌아간다. |
| 7. 추가 이동 종료 | `Index → State_Additional_Move → Index_Stop` | Home 감지 후 추가 이동 Step에 들어간다. 확인한 설정에서 이 Step의 PRE는 10ms다. `.DN`으로 Step을 벗어날 때 종료 Action이 전진 출력을 0으로 쓴다. Online Preset과 실제 추가 이동 거리는 따로 확인한다. |
| 8. 후속 동작 | `DoAutomatic → State_Wait` 이후 | `Index_Stop.X`가 되면 `State_Wait`로 넘어가고, 이후 Brush·Press 등의 조건을 거쳐 Idle로 복귀한다. 두 기능의 설정과 완료 조건에 따라 이 구간의 시간이 달라진다. |

이 설명은 정상 자동 경로를 읽기 쉽게 풀어 쓴 것이다. 실제 출력에는 로봇 이탈 허가, 정지 인터록, 수동 모드 등 다른 로직도 영향을 줄 수 있다. 또한 SFC Action은 Step 진입·종료 시 실행되는 명령이므로 화면에 그린 명령과 실제 모터·밸브의 물리적 동작은 구분해서 본다.

### 순서를 직접 눌러 보기

아래 그림은 **SFC를 이해하기 위한 수동 단계 표시**다. PLC와 연결되지 않으며 실제 시간이나 체인 거리를 재현하지 않는다. `다음 단계`를 누르면서 Slowdown, 밸브 대기 완료, Home, Bump 완료를 바꿔 보면 각 전이 조건을 볼 수 있다. 값은 이 그림 안에서만 바뀐다.

<div class="outfeed-guide" data-outfeed-guide>
  <p class="outfeed-guide-label">설명용 화면 · PLC 실측 및 에뮬레이션 아님</p>
  <div class="outfeed-track" aria-label="인덱스 동작 단계">
    <span data-guide-node="idle">시작 대기</span><span data-guide-node="index">연속 전진</span><span data-guide-node="delay">밸브 응답 대기</span><span data-guide-node="bump">원점 찾기</span><span data-guide-node="additional">추가 이동</span><span data-guide-node="stop">인덱스 완료</span>
  </div>
  <div class="outfeed-machine" aria-label="Blank 적재와 Index Wheel의 개념도">
    <div class="outfeed-machine-heading"><strong>R2 적재 위치</strong><span>→ 체인 이동 방향은 설명용</span><strong>Index Wheel</strong></div>
    <div class="outfeed-conveyor"><span>빈 자리</span><span>Blank</span><span>Blank</span><span>Blank</span></div>
    <div class="outfeed-machine-signals"><span>Blank 감지 입력</span><span>Slowdown · Home</span></div>
    <p data-guide-motion>시작 대기: 다음 Blank를 받을 빈 자리를 확인한다.</p>
  </div>
  <div class="outfeed-switches">
    <label><input type="checkbox" data-guide-input="slowdown"> Slowdown 감지</label>
    <label><input type="checkbox" data-guide-input="delayDone"> 응답 대기 DN</label>
    <label><input type="checkbox" data-guide-input="home"> Home 감지</label>
    <label><input type="checkbox" data-guide-input="bumpDone"> Bump DN</label>
    <label><input type="checkbox" data-guide-input="additionalDone"> 추가 이동 DN</label>
  </div>
  <div class="outfeed-display" aria-live="polite"><strong data-guide-title>시작 대기</strong><p data-guide-text>시작 허가가 모두 맞았다고 가정하고 다음 단계로 진행한다.</p><p data-guide-condition></p></div>
  <div class="outfeed-controls"><button type="button" data-guide-next>다음 단계</button><button type="button" data-guide-reset>처음부터</button></div>
</div>

### `30`과 `40`은 무엇을 뜻하나?

| 태그 | 확인한 설정값 | 사용하는 위치와 의미 |
|---|---|---|
| `param_valve_delay_time` | `30` | `Index → State_Valve_Response`의 Step Preset이다. Slowdown 감지 후 Step 시간이 30ms에 도달하면 `State_Valve_Response.DN=1`이 되어 Bump Step으로 갈 수 있다. |
| `param_valve_bump_time` | `40` | `Index → State_Bump_Valve`의 Step Preset이다. 이 Step에서 40ms가 지나면 `.DN=1`이 된다. Home이 여전히 0이면 `Tran_019` 조건이 참이 되어 Bump Step을 다시 시작한다. |

값의 단위는 SFC Step Preset의 **ms**다. 30ms와 40ms는 각각의 Step 시간이며, Blank 감지 필터의 현재 2초와는 다른 설정이다. [Rockwell의 Step Preset 설명](https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-02/contents-ditamap/studio-5000-logix-designer/sequential-function-chart-editor/define-the-steps-of-an-sfc-process/connect-steps/step-properties---general.html)

`param_valve_bump_time=40`을 **전진 출력이 무조건 40ms마다 꺼졌다 켜지는 설정**으로 해석하면 안 된다. 확인한 로직에서 Bump Step 진입 Action은 전진 출력에 R2 이탈 허가 값을 쓴다. `Tran_019`로 Step이 반복되면 이 진입 Action이 다시 실행되지만, Bump Step 종료 Action에서 출력을 0으로 쓰는 것은 확인되지 않았다. 실제 출력이 언제 켜지고 꺼지는지는 `o_conveyor_forward`와 다른 쓰기 조건을 함께 Trend로 확인한다. Home이 먼저 켜지면 Bump의 DN을 기다리지 않고 `Tran_007`을 통과할 수도 있다.

### Index Wheel 센서가 이상할 때 볼 수 있는 현상

| 확인할 부분 | 의심할 수 있는 현상 | 기록에서 볼 점 |
|---|---|---|
| `i_index_wheel_slowdown` | 신호가 늦거나 빠지면 연속 전진 구간이 길어지거나 진행 순서가 달라질 수 있다. | `State_Index_1.X`, 전진 출력, Slowdown 신호의 순서를 정상 기록과 비교한다. |
| `i_index_wheel_home` | Home 신호가 늦거나 빠지면 Bump가 반복되거나 Home 이후 단계 진입 위치가 달라질 수 있다. | `State_Bump_Valve.X`, Home 신호와 추가 이동 Step을 비교한다. |
| 센서 체결·감지체 | 센서 간격, 감지체 위치, 진동, 배선 등에 따라 입력이 불안정할 수 있다. | PLC 입력 상태와 실제 감지체 위치를 현장 기준에 따라 확인한다. |
| 밸브·체인 구동부 | PLC 출력이 꺼진 뒤에도 밸브·구동부 응답이나 관성으로 이동할 수 있다. | 전진 출력 OFF 시점과 실제 밸브·체인의 정지 시점을 함께 본다. |

### 8개씩 나눠 기록하기

한 번에 8개까지 저장할 수 있으므로 서로 다른 수집 회차로 나눈다. **서로 다른 회차의 파형은 같은 사건의 동시 기록이 아니다.** 각 회차에서 이상이 발생한 시각, 로봇 동작, 체인이 한 칸 더 간 시점, 설정값을 함께 적는다. 현재 2초는 추적 중인 설정이므로 정상 적재 시 대기 시간과 생산 흐름도 살핀다.

| 1차: 추가 시작 구분 | 형식 | 2차: Index Wheel 구분 | 형식 |
|---|---|---|---|
| `i_sheet_not_at_conveyor` | 디지털 | `i_index_wheel_slowdown` | 디지털 |
| `timer_sheet_present_filter.ACC` | 아날로그 | `i_index_wheel_home` | 디지털 |
| `timer_sheet_present_filter.DN` | 디지털 | `State_Index_1.X` | 디지털 |
| `State_Idle.X` | 디지털 | `State_Valve_Response.X` | 디지털 |
| `State_Auto_Index.X` | 디지털 | `State_Bump_Valve.X` | 디지털 |
| `o_conveyor_forward` | 디지털 | `State_Additional_Move.X` | 디지털 |
| `i_index_wheel_home` | 디지털 | `Index_Stop.X` | 디지털 |
| `i_index_wheel_slowdown` | 디지털 | `o_conveyor_forward` | 디지털 |

모두 `Outfeed_Conveyor` 프로그램 범위에서 선택한다. 가능하면 10~20ms 간격으로 기록한다. 한 스캔 펄스와 짧은 SFC Step은 주기 기록에서 누락될 수 있다. `permit_start`가 필요하면 1차의 `ACC`와 교체해 추가 회차로 기록하되, 펄스가 보이지 않는 것만으로 발생하지 않았다고 결론 내리지 않는다.

1차에서 Idle 복귀 후 `State_Auto_Index.X`가 다시 켜지면 새 인덱스가 시작된 경로를 확인한다. 한 번의 `State_Auto_Index.X` 안에서 예상보다 멀리 이동했다면 2차에서 Slowdown·Home과 Index Step 순서를 비교한다. 두 양상이 섞일 수 있으므로 각각 정상 기록과 비교해야 한다. 현재까지는 실제 Trend가 없어 어느 쪽이 원인인지 확정하지 않았다.
