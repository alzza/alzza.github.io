# CSM Outfeed 체인 인덱스와 빈 칸 원인 추적 · Rev.6 {#outfeed}

한 칸 더 간 이유는 아직 확인되지 않았다. 먼저 **새 인덱스가 다시 시작됐는지**, 아니면 **한 번의 인덱스에서 체인이 더 이동했는지** 구분한다.

- 현장에서는 200ms 필터에서 DN 채터링을 봤고, 600ms에서도 증상이 한 번 발생했다. 현재는 2초로 설정했다고 전달받았다.
- Blank 감지 필터는 자동 인덱스의 시작 전 조건이다. Slowdown과 Home은 시작한 뒤 Index SFC의 진행 조건이다.
- `param_valve_delay_time=30`과 `param_valve_bump_time=40`은 SFC Step Preset이며 단위는 ms다. 현장 Online 값을 확인한다.[](source:step)
- 10월 29일 Trend에서는 감지 후 약 600ms에 DN이 켜진 장면이 반복됐다. Index 시작과 Wheel 센서는 기록되지 않아 빈 칸의 원인은 확정할 수 없다.

@answer scope="Outfeed 자동 인덱스 · 현장값 확인 중"
@meta locale=ko
@source step title="Rockwell Studio 5000: SFC Step Preset" url=https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-02/contents-ditamap/studio-5000-logix-designer/sequential-function-chart-editor/define-the-steps-of-an-sfc-process/connect-steps/step-properties---general.html
@source ton title="Rockwell Studio 5000: TON" url=https://www.rockwellautomation.com/en-id/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/timer-and-counter-instructions/timer-on-delay--ton-.html

## 현재까지 무엇이 있었나? {#history}

| 설정 | 현장 경과 | 남은 확인 |
| --- | --- | --- |
| 200ms | 타이머 DN에 채터링이 나타났다. | 입력이 0으로 유지된 시간을 기록한다. |
| 600ms | 빈 칸이 생기는 증상이 한 번 발생했다고 전달받았다. | 확보한 Trend에는 600ms와 비슷한 DN 지연이 보이나, 해당 장면이 빈 칸 사건인지는 모른다. |
| 2초 | 현재 현장에서 설정한 값이다. | Online의 TON Preset과 설정 후 발생 여부를 확인한다. |

@callout level=warning title="2초를 넘는 감지는 시작 조건이 될 수 있다"
| 입력이 연속 2초 감지되면 DN이 켜진다. 기존 허가도 맞으면 인덱스를 시작할 수 있다. 필터가 모든 원인을 해결했다고 단정하지 않는다. |

## 실제 Trend에는 무엇이 찍혔나? {#field-trend}

10월 29일 16:06:36.595부터 16:16:36.585까지 10분간 10ms 간격으로 수집된 실제 PLC Trend를 분석했다. 기록에 적힌 시각이며 PLC 시계가 현장 시계와 일치하는지는 확인하지 않았다. 원본 파일은 이 페이지에 올리지 않았다.

| 항목 | 기록에서 확인한 값 |
| --- | --- |
| 샘플 | 60,000개이며 인접한 기록 시각은 모두 10ms 간격이다. |
| 완료된 감지 구간 | 입력이 0이 됐다가 1로 돌아온 구간은 89회다. 마지막에 감지 중 끝난 구간 한 개는 제외했다. |
| 필터 DN | 완료된 감지 구간 중 48회에서 DN이 켜졌다. 입력이 0으로 된 뒤 첫 DN ON은 45회가 600ms, 3회가 590ms 후에 관측됐다. |
| 입력과 DN | 10ms 샘플에서는 입력이 1인 동안 DN이 1인 샘플은 없었다. 스캔 사이의 더 짧은 변화는 이 기록으로 확인할 수 없다. |

Blank 감지 입력은 `i_sheet_not_at_conveyor=0`일 때 감지다. 590~600ms의 관측 간격은 600ms 설정 당시의 동작과 비슷하지만, 기록에 `.PRE`와 `.ACC`가 없으므로 당시 설정을 확정할 수 없다. 현재 2초 설정을 이 데이터가 검증하는 것도 아니다.

6월 20일의 유휴 시간 Trend는 수집 날짜와 태그 구성이 다르다. 두 기록을 한 사건의 동시 파형처럼 합치지 않는다. 10월 Trend에 함께 들어 있는 `Sheet_Conveyor_1`의 `i_conveyor_index`와 `ic_conveyor_position`은 Outfeed Index Wheel의 Home·Slowdown 태그가 아니다.

## DN이 두 번 켜진 구간은 어떻게 읽나? {#observed-event}

아래는 10월 29일 16:09:30~16:09:40의 실제 Trend에서 뽑은 입력과 DN의 순서다. 그림의 각 상자를 누르면 해당 시점을 살펴볼 수 있다. 이 구간이 작업자가 본 빈 칸 사건인지는 확인되지 않았다.

@workflow id=observed-flow title="16:09:30 이후 감지와 DN 전환"
| detected | 감지 시작 | external |
| dn-one | 첫 DN ON | backend |
| released | 감지 해제 | external |
| detected-again | 재감지 | external |
| dn-two | 두 번째 DN ON | backend |
| detected > dn-one | 600ms |
| dn-one > released | 320ms |
| released > detected-again | 50ms |
| detected-again > dn-two | 600ms |

@steps id=observed-walk
| obs-one | 감지 시작 | 16:09:30.445에 입력이 0이 됐고 DN은 0이었다. | observed-flow | detected |
| obs-two | 첫 DN ON | 16:09:31.045에 입력이 0인 상태에서 DN이 1로 바뀌었다. | observed-flow | dn-one |
| obs-three | 감지 해제 | 16:09:31.365에 입력이 1로 돌아오며 DN이 0이 됐다. | observed-flow | released |
| obs-four | 재감지 | 16:09:31.415에 입력이 다시 0이 됐다. 해제된 상태가 기록된 시간은 50ms다. | observed-flow | detected-again |
| obs-five | 두 번째 DN ON | 16:09:32.015에 DN이 다시 1이 됐다. 첫 DN ON과의 간격은 970ms다. | observed-flow | dn-two |

@callout level=warning title="DN 두 번은 인덱스 두 번의 증거가 아니다"
| 시작 허가의 다른 조건, `permit_start`, `State_Auto_Index.X`, Outfeed 전진 출력과 Wheel 센서는 이 파일에 없다. 두 번째 DN이 실제 시작을 만들었는지, 체인이 움직였는지는 판단할 수 없다. 입력 변화가 제품 흔들림인지 센서·배선 문제인지도 확정하지 않는다. |

## 2초 설정이면 정상 적재가 진행될까? {#two-second-check}

600ms로 보이는 기록에서 DN이 켜진 48개 감지 구간 가운데 45개는 최종적으로 2초 전에 입력이 1로 돌아왔다. 나머지 3개 구간은 2초를 넘었다. 이것만으로 2초 설정에서 정상 적재가 실패한다고 계산하면 안 된다. 기존에는 DN이 켜진 뒤 설비가 움직이면서 입력이 바뀌었을 수 있어, 2초로 바꾸면 파형 자체가 달라질 수 있다.

현재 설정에서 정상 Blank가 놓인 뒤 `ACC`가 2000까지 올라가는지, DN과 정상 인덱스가 이어지는지 확인한다. 적재 대기 시간이 조업 흐름에 미치는 영향도 함께 기록한다.

## R2 적재 뒤 체인은 어떻게 움직이나? {#index}

R2가 내려놓을 위치는 빈 자리로 대기한다. R2가 Blank를 놓고 이탈한 뒤, 감지 확인과 기존 허가가 맞으면 자동 인덱스를 시작한다. 그림은 주요 경로의 설명도이며 실제 기계 형상과 이동 거리는 표현하지 않는다.

그림 옆의 `Step through`를 누른 다음 `Next`를 누르면 각 단계를 차례로 강조한다. 그림의 항목을 눌러 해당 위치를 자세히 볼 수도 있다. 화면의 조작 버튼 일부는 영어로 표시된다.

@workflow id=index-flow title="Blank 감지부터 인덱스 완료까지"
| sensor | Blank 감지 | external |
| permit | 시작 허가 | backend |
| forward | 연속 전진 | backend |
| valve | 밸브 응답 대기 | backend |
| bump | Home 찾기 | backend |
| finish | 추가 이동과 완료 | backend |
| sensor > permit | 필터 DN |
| permit > forward | permit_start |
| forward > valve | Slowdown |
| valve > bump | 대기 DN |
| bump > finish | Home |

@steps id=index-walk
| s-sensor | Blank 감지 | 입력 `i_sheet_not_at_conveyor=0`이 설정 시간 동안 유지되면 필터 DN이 켜진다. | index-flow | sensor |
| s-permit | 시작 허가 | `Permits`의 Rung 0은 필터 DN과 자동 운전, R2 이탈, 그리퍼, 리프트, Idle 등 기존 조건을 확인한다. `single_cycle`은 별도 병렬 경로다. | index-flow | permit |
| s-forward | 연속 전진 | `DoAutomatic`이 `State_Auto_Index`로 들어가 `Index`를 호출한다. `State_Index_1`의 진입 Action은 전진 출력을 로봇 이탈 허가 값으로 쓴다. | index-flow | forward |
| s-valve | 밸브 응답 대기 | `i_index_wheel_slowdown=1`이면 연속 전진 Step을 벗어나며 종료 Action이 전진 출력에 0을 쓴다. 응답 대기 Step의 PRE는 확인한 기준에서 30ms다. | index-flow | valve |
| s-bump | Home 찾기 | Bump Step 진입 Action은 전진 출력을 로봇 이탈 허가 값으로 쓴다. Home이 1이면 추가 이동으로 가고, Home이 0인 상태에서 Bump DN이 1이면 Step을 반복한다. | index-flow | bump |
| s-finish | 추가 이동과 완료 | Home 이후 `State_Additional_Move.DN`으로 Step을 벗어날 때 종료 Action이 전진 출력에 0을 쓴다. 확인한 Step PRE는 10ms지만 Online 값을 다시 본다. 이후 `Index_Stop`과 후속 동작을 거친다. | index-flow | finish |

@callout level=note title="출력과 실제 체인 위치를 함께 본다"
| Action의 출력 쓰기는 밸브와 모터가 실제로 멈춘 시각을 뜻하지 않는다. 인터록과 기계 응답도 영향을 주므로 출력과 체인 위치를 함께 확인한다. |

## 밸브 시간 30과 40은 무엇인가? {#timers}

| 태그 | 확인한 값 | 실제 역할 |
| --- | --- | --- |
| `param_valve_delay_time` | 30ms | `State_Valve_Response`의 PRE다. Slowdown을 감지한 뒤 이 Step의 DN을 기다린다. |
| `param_valve_bump_time` | 40ms | `State_Bump_Valve`의 PRE다. Home이 0인 상태에서 DN이 되면 `Tran_019`로 같은 Step을 다시 시작할 수 있다. |
| `State_Additional_Move.PRE` | 10ms | 확인한 기준의 추가 이동 Step PRE다. 실제 Online 설정과 체인 이동량은 별도로 확인한다. |
| `timer_sheet_present_filter.PRE` | 현재 2000ms로 전달받음 | Blank 감지의 시작 전 필터다. 위 세 시간과 역할이 다르다. |

@callout level=warning title="Bump 40ms는 출력이 40ms마다 꺼진다는 뜻이 아니다"
| 확인한 로직에는 Bump Step 종료 시 전진 출력을 0으로 쓰는 Action이 없다. 반복 진입 때 출력 명령을 다시 쓸 수 있다. 실제 출력 상태는 Trend로 확인한다. Home이 먼저 1이 되면 Bump DN을 기다리지 않고 다음 Step으로 갈 수 있다. |

@workflow id=home-decision title="Bump Step에서 Home을 확인하는 조건"
| bump-entry | Bump Step | backend |
| home-check | Home 감지? | backend |
| done | 추가 이동 | backend |
| repeat | Bump 재진입 | backend |
| bump-entry > home-check | 조건 확인 |
| home-check > done | ON |
| home-check > repeat | OFF, DN ON |

Home이 0이고 Bump DN도 0이면 두 전이 모두 기다린다. 반복 경로는 같은 Bump Step으로 돌아가는 동작이다.

## 어디서 한 칸이 더 생겼는지 어떻게 구분하나? {#diagnosis}

| 관찰 | 확인할 가능성 | 비교할 신호 |
| --- | --- | --- |
| Idle로 돌아간 다음 Auto Index가 다시 시작됐다. | 2초 이상 지속된 감지, 시작 허가의 재성립 또는 별도 single cycle 경로를 확인한다. | Blank 입력, 필터 ACC·DN, Idle, Auto Index |
| Auto Index 한 번 안에서 이동 거리가 길었다. | Slowdown·Home 신호의 시점, Bump 반복, 밸브와 기계 응답을 확인한다. | Slowdown, Home, Index Step, 전진 출력 |
| PLC 전진 출력은 꺼졌는데 체인이 더 움직였다. | 밸브 응답, 구동부와 관성 등 물리적 정지 지연을 살펴본다. | 전진 출력 OFF 시점과 실제 체인 정지 시각 |

설정값을 바로 바꾸기보다 정상 동작과 이상 동작의 기록을 비교한다. 출력이 여러 번 보인다는 사실만으로 두 번의 새 인덱스라고 단정하지 않는다.

## Trend는 8개씩 어떻게 나누나? {#trend}

한 회차에서 PLC당 8개까지 기록한다. 두 회차는 서로 다른 사건이므로 같은 시각의 기록처럼 합치지 않는다. 가능하면 10~20ms 간격으로 기록하고, 한 스캔 펄스나 짧은 Step을 놓칠 수 있음을 고려한다.

1차: 추가 시작 경로를 확인한다.

| 번호 | 태그 | 종류 |
| --- | --- | --- |
| 1 | `i_sheet_not_at_conveyor` | 디지털 |
| 2 | `timer_sheet_present_filter.ACC` | 아날로그 |
| 3 | `timer_sheet_present_filter.DN` | 디지털 |
| 4 | `timer_sheet_present_filter.PRE` | 아날로그 |
| 5 | `State_Idle.X` | 디지털 |
| 6 | `State_Auto_Index.X` | 디지털 |
| 7 | `o_conveyor_forward` | 디지털 |
| 8 | `i_index_wheel_home` | 디지털 |

2차: Wheel과 인덱스 진행을 확인한다.

| 번호 | 태그 | 종류 |
| --- | --- | --- |
| 1 | `i_index_wheel_slowdown` | 디지털 |
| 2 | `i_index_wheel_home` | 디지털 |
| 3 | `State_Index_1.X` | 디지털 |
| 4 | `State_Valve_Response.X` | 디지털 |
| 5 | `State_Bump_Valve.X` | 디지털 |
| 6 | `State_Additional_Move.X` | 디지털 |
| 7 | `Index_Stop.X` | 디지털 |
| 8 | `o_conveyor_forward` | 디지털 |

모두 `Outfeed_Conveyor` 프로그램 범위의 태그다. `permit_start`를 확인할 때는 별도 회차에서 1차 ACC와 교체한다. 펄스가 기록에 보이지 않는 것만으로 발생하지 않았다고 결론 내리지 않는다.

## 현장 작업 로직은 어디서 확인하나? {#changes}

현재 2초는 작업자에게 전달받은 설정이다. 다음 RLL은 Online 값이 2000ms로 적용됐다는 가정의 정리다. 기존 프로그램과 적용 상태를 대조한다.

| 위치 | 작업 내용 |
| --- | --- |
| `Outfeed_Conveyor / MainRoutine` | Brush 완료 처리 원본 Rung 4 뒤, 원본 `JSR(Background,0);` 앞에 TON을 별도 렁으로 추가한다. |
| `Outfeed_Conveyor / Permits / Rung 0` | `XIC(z_System_Running.X)` 바로 뒤의 `XIO(i_sheet_not_at_conveyor)`를 `XIC(timer_sheet_present_filter.DN)`으로 바꾼다. |
| `Background / Rung 2`, `Permits / Rung 5` | Rev.1에서 변경했다면 해당 접점을 원본으로 복구한다. Rev.3부터는 이 두 곳을 변경하지 않는 안이다. |

```text title="추가할 TON: 현재 전달받은 2초 설정"
XIO(i_sheet_not_at_conveyor)TON(timer_sheet_present_filter,2000,0);
```

```text title="Permits Rung 0: 변경 전"
SBR()[XIC(z_System_Running.X)XIO(i_sheet_not_at_conveyor)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);
```

```text title="Permits Rung 0: 변경 후"
SBR()[XIC(z_System_Running.X)XIC(timer_sheet_present_filter.DN)XIC(z_permit_bcar_outfeed_run)[XIC(i_conveyor_not_full),XIC(z_permit_bcar_outfeed_lifted)]XIC(i_hangar_lift_up)XIC(i_gripper_1_open)XIC(i_gripper_2_open)XIC(State_Idle.X),XIC(single_cycle)]XIC(z_permit_robot_clear_of_outfeed)XIC(interlock_home)ONS(permit_start_ons)OTE(permit_start);
```

[변경 전·후 LD와 세부 적용 절차 열기](https://alzza.github.io/notes/csm-outfeed-work-archive/)

## 다음 근무 때 확인할 것 {#check}

- [ ] 2초 설정 후 추가 빈 칸이 있었는지, 발생 시각과 로봇 동작을 기록한다.
- [ ] 가능하면 10월 29일 16:09:31 전후가 실제 빈 칸 발생 시점인지 작업 기록과 대조한다. PLC 시계의 시간 차이도 확인한다.
- [ ] Online에서 `timer_sheet_present_filter.PRE`, 두 밸브 시간값, `State_Additional_Move.PRE`를 확인한다.
- [ ] 정상 사이클과 이상 사이클을 같은 8개 태그 구성으로 각각 저장한다.
- [ ] Idle을 거친 재시작인지 한 번의 인덱스 중 과이동인지 비교한다.
- [ ] 입력과 출력 시각을 실제 센서 감지체·밸브·체인 위치와 비교한다.
