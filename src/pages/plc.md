---
layout: ../layouts/PlcDoc.astro
title: "SC1 Robot3 깔딱 HMI Enable=1 1차 시험안"
description: "CSM SC#1 Robot3 조기 진입 체인 깔딱. PHASE-1 현장 시험안. 메인 목록에는 올리지 않음."
revision: "2026-08-22 / Revision 2"
status: "PHASE-1 HMI_ENABLE=1 TEST / FIELD-VALIDATION REQUIRED"
---

CSM SC#1 Robot3 조기 진입에 의한 체인 깔딱 현상의 HMI Enable=1 시험안이다.


## 0. 최종 결론


1차 시험 방향은 다음과 같이 확정한다.

1) Robot3 프로그램은 수정하지 않는다.
2) SC1 속도/거리 파라미터도 1차 수정에서는 변경하지 않는다.
3) PLC의 Sheet_Conveyor_1 / Permits / Rung 6 한 곳만 수정한다.
4) sc1_hmi_enable=1이고 AUTO이며 SC1 실제 전진 사이클이 진행 중인 동안
   z_permit_sc1_r3_unload만 차단한다.
5) SC1 사이클이 끝나면 기존 조건으로 Robot3 진입을 자동 복원한다.
6) MANUAL/OFF에서는 추가 차단을 우회하여 기존 Robot3 진입 조건을 유지한다.
7) sc1_hmi_enable=0에서는 추가 Gate 전체를 우회한다.
   따라서 enable=0의 Rung 6은 Cathode1(260714).L5X 원본과 동일하다.
8) 우선 sc1_hmi_enable=1로 시험하여 깔딱이 사라지는지 확인한다.
   증상이 없어질 때만 다음 수정/적용 계획을 별도로 수립한다.

최종 추가 조건의 논리는 아래 한 줄이다.

    HMI_ENABLE AND AUTO AND sc1_start_req_active = 1
        -> Robot3 신규 Unload 진입 차단
    그 외
        -> 기존 Rung 6과 동일

주의:
이 문서는 L5X, Robot3 LS 소스, CSV Trend를 교차 검토한 1차 시험안이다.
그러나 Studio 5000 Verify/Compile, 실제 Controller Online Trend,
저속 현장 시험은 아직 수행하지 않았으므로 생산 적용 완료본으로 표시하면 안 된다.


## 1. 검토한 원본과 무결성


[PLC 기본 베이스]
파일: sc1-improvement-project/reference/Cathode1(260714).L5X
SHA-256: c98ac2a646e9ba7fdc6f6563e61f7e21ef61532db136cb50c4ca587015e624bb

[CSM1 Robot3]
RSR0001.LS SHA-256: 4b98a2b358c4ddc268269b8828cf82871b0f71470025a7d1bab3f71144427e49
ULOD_INF.LS SHA-256: 270e6ba3189d8c06539e5f3c6da376ad96f97de70c4c702ac6e5f21a6cc6d8ff
OFSTZERO.LS SHA-256: ffef3994e985a05b6821eff93c63f3f6c1ad70c522cd534484cc9a9930dd1808
OFSTNORM.LS SHA-256: ffa1364684377bffa7697df25195609ff97aa432bd77b20f0e97851530f3d07f
OFSTREV.LS  SHA-256: 828aa1eb16b3d520ce6e26f09afa9a1519aa5f7b9c07881e34aeb6ad579a5c25

[CSM2 Robot3 비교본]
RSR0001.LS SHA-256: d6d611f72d1b5fe35395d9e280748968c49e549aa9994e9ebe6d961e5d80c2b1
UNLD_INF.LS SHA-256: 57e8d7d7e832dfe4fd709f62da70f0a3cca46db5f53f2fae99f2a5851c1eb4ce

[CSV Trend]
SC1_trend_A_pending.CSV SHA-256:
0f0b80820f6f47cd091ef7b931c07fd4eb7703fde86eb99b0981388a31c8dd1f
SC1_trend_B_RGrade_600ms.CSV SHA-256:
28df284722f4aa31206f554dc1e6e6fd34edcec74adf5fd7afb4469553417561
SC1_Trend_C_Robot3.CSV SHA-256:
258d1ad607917ef0862980229a0634d1ffb5da69f97eeec5e6f51d0e7fdd85a3

원본 L5X, Robot LS, CSV 파일은 읽기만 했으며 수정하지 않았다.


## 2. L5X에서 확인된 실제 신호 체인


2.1 SM1 또는 SM2 Sheet Drop 신호

Sheet_Conveyor_1 / Permits / Rung 2:

XIO(z_mode_off)

```text
[XIC(z_signal_sm1_sc1_start),XIC(z_signal_sm2_sc1_start)]
```
ONS(sheet_dropped_ons)
[OTL(sheet_dropped),OTL(sc1_start_req_pending)];

확인 사항:
- sc1_start_req_pending은 sc1_hmi_enable과 무관하게 생성된다.
- OFF가 아닌 상태에서 SM1 또는 SM2 시작 신호의 상승 에지로 래치된다.

2.2 SC1 실제 전진 시작 표시

Sheet_Conveyor_1 / Permits / Rung 14:

XIC(sc1_start_req_pending)
XIC(State_Forward_Fast_To_Flag.X)
OTL(sc1_start_req_active);

확인 사항:
- sc1_start_req_active도 sc1_hmi_enable과 무관하게 생성된다.
- pending만 있는 대기 상태가 아니라 SC1 전진 State가 실제 시작되었을 때 래치된다.
- CSV에서는 permit_start 상승 후 358회 모두 30 ms 뒤 active가 켜졌다.

2.3 SC1 정상 완료 시 active 해제

Sheet_Conveyor_1 / Permits / Rung 15:

XIC(sc1_start_req_active)
XIC(State_Stop.X)
GRT(var_counts_target,0)
GEQ(var_counts_accum_32,var_counts_target)
[OTU(sc1_start_req_pending),OTU(sc1_start_req_active)];

확인 사항:
- 단순 센서 감지가 아니라 State_Stop과 목표 Count 도달을 모두 확인한 뒤 해제된다.
- 따라서 active=1은 Robot 진입을 막아야 하는 실제 SC1 이동 구간의 보수적 표시로 사용할 수 있다.

2.4 MANUAL/OFF/RESET 복구

Sheet_Conveyor_1 / Permits / Rung 5에서 OFF, MANUAL 또는 Reset 경로로
pending, active, data_move_armed가 해제된다.
또한 최종 시험안은 XIO(sc1_hmi_enable) 및 XIO(z_mode_automatic)
우회 경로를 가진다. 따라서 HMI Enable=0 또는 MANUAL/OFF에서는
active 상태와 관계없이 기존 Robot 허가 조건을 사용한다.

2.5 기존 Robot3 Unload 허가

Cathode1(260714).L5X의 Sheet_Conveyor_1 / Permits / Rung 6 원본:


```text
[XIC(interlock_stopped),XIC(z_System_Running.X)XIC(permit_sc1_r3_slowdown)]XIO(i_sheet_not_at_transfer)OTE(z_permit_sc1_r3_unload);
```

주의:
- i_sheet_not_at_transfer는 부정 명칭의 입력이다.
- XIO(i_sheet_not_at_transfer)가 참이라는 것은 전송 위치에 Sheet가 있다는 뜻이다.
- z_System_Running.X와 permit_sc1_r3_slowdown은 삭제하지 않는다.
- interlock_stopped 우회 경로도 원본 그대로 유지한다.

2.6 Robot3가 SC1 전진을 허가하는 Clear 신호

Robot3 / Permits / Rung 0:

SBR()XIC(i_clear_of_infeed)OTE(z_permit_r3_sc1_start);

Sheet_Conveyor_1 / Permits / Rung 1:

XIO(f_sheet_at_transfer_timeout)XIC(z_permit_r3_sc1_start)OTE(permit_run_forward);

즉 Robot3가 진입하여 i_clear_of_infeed가 꺼지면
SC1의 permit_run_forward도 꺼질 수 있다.


## 3. Robot3 프로그램 재검토


3.1 CSM1 실제 호출 흐름

RSR0001 /MN 24:
IF DI[1:Unload Infeed]=ON,CALL ULOD_INF ;

ULOD_INF /MN 14:
DO[1:Clear of Infeed]=OFF ;

ULOD_INF /MN 16:
J PR[2:Infeed Perch] 100% CNT100 ACC150 ;

OFSTZERO, OFSTNORM, OFSTREV에서는 Pick과 이탈 동작 후
Clear 위치에 도달하는 경로의 끝에서 DO[1:Clear of Infeed]=ON을 출력한다.

3.2 CSM2 비교 결과

CSM2도 RSR0001 /MN 24에서 DI[1:Unload Infeed]를 보고 UNLD_INF를 호출하고,
UNLD_INF /MN 15에서 DO[1:Clear of Infeed]=OFF로 만든다.
세부 좌표와 속도는 CSM1과 다르지만 DI/DO 역할과 호출 구조는 동일하다.

3.3 핵심 판단

Robot 메인에서 DI[1]이 ON인 순간 Unload 서브프로그램이 호출된다.
호출된 ULOD_INF/UNLD_INF 내부에는 DI[1]을 매 스텝 다시 확인하여
동작을 취소하는 조건이 없다.

따라서 PLC 수정의 목적은 다음과 같아야 한다.

- 이미 들어간 Robot을 중간에 멈추는 것: 금지
- SC1 이동 완료 전 신규 Robot 호출 자체를 허가하지 않는 것: 채택

이 목적에는 Robot 좌표/티칭/LS 프로그램 수정이 필요하지 않다.


## 4. CSV Trend 교차 검토 결과


공통 조건:
- 2026-07-29 약 1시간
- 10 ms Sample
- A/B/C 각각 360,000 Samples
- A Trend의 sc1_hmi_enable은 360,000 Samples 모두 1이었다.

중요 수치:
- sc1_start_req_active 상승: 358회
- permit_start 상승: 386회
- z_permit_sc1_r3_unload 상승: 366회
- i_clear_of_infeed 하강: 363회
- permit_start 상승에서 active 상승까지: 358회 모두 30 ms
- Robot Unload 허가 상승 366회 중 active=1 상태: 356회
- active 진행 중 Robot Unload 허가가 상승한 SC1 사이클: 350회
- active 상승 -> Robot Unload 허가 상승 중앙값: 1,558 ms
- Robot Unload 허가 상승 -> active 해제 중앙값: 672 ms
- 위 시간의 95 percentile: 1,912 ms
- i_clear_of_infeed 하강 당시 active=1: 178회

대표 사이클:

03:38:46.260  sc1_start_req_active = 1
03:38:48.458  z_permit_sc1_r3_unload = 1
03:38:48.598  i_clear_of_infeed = 0
03:38:49.170  sc1_start_req_active = 0

이 사이클에서는 Robot 허가가 SC1 완료보다 712 ms 먼저 나왔고,
Robot Clear가 SC1 완료보다 572 ms 먼저 꺼졌다.

판단:
- Robot 신규 진입 허가가 SC1 실제 완료보다 먼저 생기는 현상은 CSV로 확인된다.
- Robot Clear OFF와 active 구간이 겹치는 현상도 반복 확인된다.
- 이는 깔딱 현상의 강한 원인 후보이며 L5X 신호 체인과 일치한다.
- 다만 CSV만으로 실제 기계의 물리적 미세 이동량을 직접 측정한 것은 아니므로
  최종 원인 확정은 수정 후 Online Trend와 현장 관찰로 해야 한다.

제한 사항:
- 이 CSV에는 z_mode_automatic이 없다.
- sc1_hmi_enable=0 구간도 없다.
- 이번 1차 시험은 enable=1 구간만 개선 동작을 확인한다.
- enable=0은 개선 효과 시험 대상이 아니라 원본 등가성 확인 대상이다.
- 2026-07-21 SM1/SM2 CSV는 Robot3 Trend와 날짜가 달라 직접 시간 정렬할 수 없다.
  해당 구간에서는 SM1 시작 상승이 102회였고 SM2 시작 상승은 없었다.

예외 관찰:
- active 유지 시간 중앙값은 2,240 ms였지만 최대 73,860 ms 구간이 있었다.
- enable=1 AUTO에서 active가 비정상적으로 오래 유지되면 시험안은 Robot 진입도
  보수적으로 오래 막는다. 이때 active를 강제로 해제하지 말고 SC1 미완료 원인을 확인한다.
- MANUAL/OFF 전환 시에는 추가 Gate를 우회하므로 기존 복구 동작은 유지된다.


## 5. 채택/폐기한 수정안과 이유


5.1 sc1_hmi_enable=0에서 원본을 그대로 우회시키는 안

채택한다.
- 이번 단계의 목적은 sc1_hmi_enable=1에서 수정 효과를 먼저 검증하는 것이다.
- XIO(sc1_hmi_enable)를 우회로 두어 enable=0에서는 원본 Rung 6과 같게 한다.
- enable=1 시험에서 증상이 없어져야만 후속 적용 범위를 다시 결정한다.

5.2 sc1_start_req_pending으로 Robot을 차단하는 안

폐기 이유:
- pending은 SC1이 실제로 움직이기 전 대기 상태에서도 1이다.
- 전송 위치에 기존 Sheet가 있으면 f_sheet_at_transfer_latch가 SC1 시작을 막는다.
- 이때 pending으로 Robot도 막으면 Robot은 기존 Sheet를 Pick하지 못하고,
  SC1은 전송 위치가 비워지지 않아 시작하지 못하는 상호 대기 가능성이 생긴다.
- active는 SC1이 실제 전진 State에 들어간 뒤에만 켜지므로 이 문제를 피한다.

5.3 z_System_Running.X 삭제

폐기 이유:
- 기존 자동운전 안전/운전 전제 조건을 불필요하게 제거한다.
- 최소 수정 원칙과 맞지 않는다.

5.4 permit_sc1_r3_slowdown 삭제

폐기 이유:
- 기존 Robot3 사전 진입 타이밍 구조를 전부 바꾸게 된다.
- 최종 시험안은 이 조건을 유지한 상태에서 enable=1 AUTO active 구간만 추가 차단한다.

5.5 Robot 좌표, Clear 위치 또는 속도 수정

현재 단계에서는 폐기한다.
- 소스만으로 실제 안전 경계 좌표를 확정할 수 없다.
- PLC 허가가 SC1 완료보다 먼저 나오는 것이 먼저 확인되었으므로
  PLC의 신규 진입 허가 시점부터 바로잡는 것이 최소 수정이다.


## 6. 현재 사진 로직 - 사진 판독 Neutral Text


아래는 2026-08-22 사진에서 판독한 현재 Rung이다.
사진 기반 전사이므로 적용 전 Online Rung과 문자 단위로 대조한다.


```text
[XIC(interlock_stopped),XIC(z_System_Running.X)XIC(permit_sc1_r3_slowdown)[XIO(sc1_hmi_enable),XIC(sc1_hmi_enable)XIC(State_Stop.X)]]XIO(i_sheet_not_at_transfer)OTE(z_permit_sc1_r3_unload);
```

이 로직을 다시 시험안으로 교체하는 이유:

1) sc1_hmi_enable=0에서 원본을 그대로 통과시키는 것은 이번 시험 목적에 맞다.
2) 그러나 enable=1의 State_Stop 조건은 System Running 하부 경로 안에만 있다.
3) interlock_stopped 상부 경로는 HMI/State_Stop Gate 바깥이라 별도로 통과할 수 있다.
4) 새 시험안은 원본 두 경로가 합쳐진 뒤 HMI/AUTO/active Gate를 배치하여
   enable=1 AUTO active 구간에는 어느 원본 경로도 Robot 허가를 우회하지 못하게 한다.


## 7. 1차 HMI Enable 시험용 Neutral Text - 복사/붙여넣기용


수정 위치:
Program: Sheet_Conveyor_1
Routine: Permits
Rung: 6

7.1 최종 1차 시험본


```text
[XIC(interlock_stopped),XIC(z_System_Running.X)XIC(permit_sc1_r3_slowdown)]XIO(i_sheet_not_at_transfer)[XIO(sc1_hmi_enable),XIO(z_mode_automatic),XIO(sc1_start_req_active)]OTE(z_permit_sc1_r3_unload);
```

논리식으로 표현하면:

기존 Robot 허가 조건
AND
((NOT HMI_ENABLE) OR (NOT AUTO) OR (NOT SC1_ACTIVE))

즉 sc1_hmi_enable=1, AUTO, SC1 실제 전진 진행 중의 세 조건이
모두 성립할 때만 Robot3 신규 진입 허가를 막는다.

7.2 즉시 원복용 - Cathode1(260714).L5X 원본


```text
[XIC(interlock_stopped),XIC(z_System_Running.X)XIC(permit_sc1_r3_slowdown)]XIO(i_sheet_not_at_transfer)OTE(z_permit_sc1_r3_unload);
```

7.3 현재 사진 상태로 되돌릴 때 사용하는 전사본


```text
[XIC(interlock_stopped),XIC(z_System_Running.X)XIC(permit_sc1_r3_slowdown)[XIO(sc1_hmi_enable),XIC(sc1_hmi_enable)XIC(State_Stop.X)]]XIO(i_sheet_not_at_transfer)OTE(z_permit_sc1_r3_unload);
```

주의:
- 가장 신뢰할 수 있는 원복 기준은 7.2의 L5X 원본이다.
- 7.3은 사진에서 판독한 것이므로 Online 원본 백업을 먼저 Export한다.
- 어떤 경우에도 L5X 전체 파일을 직접 덮어쓰지 않는다.


## 8. 모드별 동작 검토


| HMI Enable | MODE | active | 추가 Gate 결과 | Robot3 동작 |
| --- | --- | --- | --- | --- |
| 0 | ALL | 0/1 | 통과 | 원본 Rung 6과 동일 |
| 1 | AUTO | 0 | 통과 | 기존 Rung 6 조건대로 진입 가능 |
| 1 | AUTO | 1 | 차단 | SC1 정상 완료까지 신규 Unload 진입 차단 |
| 1 | MANUAL | 0/1 | 통과 | 기존 Rung 6과 동일 |
| 1 | OFF | 0/1 | 통과 | 기존 Rung 6과 동일 |

sc1_hmi_enable=0:
- XIO(sc1_hmi_enable) 경로가 참이므로 추가 Gate를 완전히 우회한다.
- AUTO/MANUAL/OFF 및 active 값과 관계없이 Rung 6은 L5X 원본과 동일하다.
- 1차 시험에서 enable=0은 개선 효과 대상이 아니라 원본 회귀시험 대상이다.

전송 위치에 기존 Sheet가 있고 새 SM Drop 요청도 들어온 경우:
- enable=1에서도 pending=1, active=0이면 Robot3는 기존 조건대로 먼저 Pick할 수 있다.
- 전송 위치가 비워지면 SC1이 시작되고 active=1이 된다.
- 이때부터 SC1 완료까지 다음 Robot 신규 진입만 차단한다.
- 따라서 pending Gate와 달리 상호 대기 위험을 줄인다.

AUTO 도중 MANUAL/OFF로 전환한 경우:
- XIO(z_mode_automatic)가 참이 되어 추가 Gate는 우회된다.
- 그래도 기존 interlock_stopped, System Running/slowdown,
  i_sheet_not_at_transfer 조건은 그대로 남아 있다.
- 즉 추가 Gate만 해제되며 기존 허가 조건을 제거하지 않는다.


## 8A. pending / active / permit_run_forward 상세 해설


8A.1 세 신호의 역할

sc1_start_req_pending:
- SM1/SM2에서 SC1 전진 요청이 들어왔다는 사실을 기억하는 래치이다.
- 아직 SC1이 실제로 출발하지 못한 대기 상태에서도 1일 수 있다.
- 짧게 들어오는 SM 시작 신호가 사라져도 시작 요청을 잃지 않기 위한 상태이다.

sc1_start_req_active:
- SC1이 State_Forward_Fast_To_Flag Step에 실제 진입한 뒤 1이 된다.
- SC1이 목표 Count에 도달하고 State_Stop 완료가 확인될 때까지 1을 유지한다.
- “SC1 한 Pitch 전진 사이클이 시작됐고 아직 완료되지 않았다”는 의미이다.
- 모터가 매 순간 실제로 회전하고 있다는 뜻은 아니다.

permit_run_forward:
- SC1 모터에 전진 전압을 줄 수 있는 실시간 허가이다.
- Robot3의 i_clear_of_infeed에서 만들어지는 z_permit_r3_sc1_start에 의존한다.
- Robot3가 Infeed 영역으로 들어가 Clear가 OFF되면 permit_run_forward도 OFF될 수 있다.

간단히 표현하면:

pending = “가야 한다는 주문을 기억 중”
active  = “출발했고 아직 도착 완료 전”
permit_run_forward = “지금 실제로 모터를 돌려도 됨”

8A.2 active=0이 되는 경우

[경우 A: 정상 Idle 대기]

pending = 0
active  = 0
State_Idle.X = 1

- 새 SC1 이동 요청이 없는 상태이다.
- 전송 위치에 Sheet가 있고 기존 허가 조건이 맞으면 Robot3가 진입할 수 있다.

[경우 B: 요청은 있지만 SC1이 아직 출발하지 못함]

pending = 1
active  = 0

가능한 원인 예:
- Robot3가 아직 Infeed 영역에서 빠져나오지 않아 Clear가 OFF이다.
- 전송 위치에 기존 Sheet가 있어 f_sheet_at_transfer_latch가 시작을 막는다.
- SC1이 Home/Idle 조건을 만족하지 않는다.
- 다른 permit_start 전제 조건이 만족되지 않는다.

이 상태는 “요청을 기억했지만 아직 출발 전”이다.
여기서 pending만 보고 Robot을 차단하면 안 된다.
전송 위치에 기존 Sheet가 있는 경우 Robot이 먼저 그 Sheet를 Pick해야
SC1이 출발할 수 있기 때문이다.

[경우 C: SC1 이동 정상 완료]

active는 다음 조건에서 해제된다.

XIC(sc1_start_req_active)
XIC(State_Stop.X)
GRT(var_counts_target,0)
GEQ(var_counts_accum_32,var_counts_target)
[OTU(sc1_start_req_pending),OTU(sc1_start_req_active)];

위치: Sheet_Conveyor_1 / Permits / Rung 15

즉 다음 조건을 모두 확인해야 active가 0으로 돌아간다.
- 실제 전진 사이클이 시작된 상태
- State_Stop 도달
- 목표 Count가 유효함
- 실제 누적 Count가 목표 Count 이상임

[경우 D: Manual / Off / Reset 복구]

- Sheet_Conveyor_1 / Permits / Rung 5에 pending, active, armed 해제 경로가 있다.
- 시험용 Robot Gate도 XIO(z_mode_automatic)으로 Manual/Off를 우회한다.
- 따라서 Manual/Off에서는 active가 Robot 진입을 추가로 차단하지 않는다.

8A.3 active=1이 되는 순간

순서 1: SM1 또는 SM2 Drop 시작 신호가 들어온다.

z_signal_sm1_sc1_start OR z_signal_sm2_sc1_start
    -> ONS(sheet_dropped_ons)
    -> OTL(sheet_dropped)
    -> OTL(sc1_start_req_pending)

위치: Sheet_Conveyor_1 / Permits / Rung 2

순서 2: 시작 조건이 모두 맞으면 permit_start가 ON된다.

주요 조건:
- System Running 또는 Single Cycle
- sheet_dropped/runout/enable+pending 시작 요청
- Robot3 Clear
- interlock_home
- 전송 위치 기존 Sheet latch 없음

위치: Sheet_Conveyor_1 / Permits / Rung 0

순서 3: SFC가 State_Idle에서 State_Forward_Fast_To_Flag로 진입한다.

State_Idle
    -> permit_start
State_Forward_Fast_To_Flag

순서 4: pending=1이고 Forward Step이 실제 활성화되면 active를 래치한다.

XIC(sc1_start_req_pending)
XIC(State_Forward_Fast_To_Flag.X)
OTL(sc1_start_req_active);

위치: Sheet_Conveyor_1 / Permits / Rung 14

CSV Trend에서는 포착된 358회 모두 permit_start 상승 후 약 30 ms에
sc1_start_req_active가 1이 되었다.

8A.4 깔딱 후 자동 재전진이 가능한 기존 원리

[확정된 프로그램 구조]

Robot3 Clear가 OFF되면 다음 경로가 성립할 수 있다.

i_clear_of_infeed = 0
    -> z_permit_r3_sc1_start = 0
    -> permit_run_forward = 0

Sheet_Conveyor_1 / BasicControl은 var_cmd_speed가 2, 1, 3일 때
permit_run_forward 또는 Manual 조건이 있어야 전진 전압을 출력한다.

var_cmd_speed = 2 AND permit_run_forward -> High Speed 전압
var_cmd_speed = 1 AND permit_run_forward -> Low Speed 전압
var_cmd_speed = 3 AND permit_run_forward -> Homing 전압
그 외 조건 불성립                         -> var_volts_velocity = 0

따라서 AUTO 전진 중 Robot Clear가 OFF되면 모터 전압이 0으로 떨어질 수 있다.

그러나 이 순간에도 다음 상태는 완료 조건이 성립하지 않으면 남아 있을 수 있다.
- 진행 중 SFC Step
- var_cmd_speed
- sc1_start_req_pending
- sc1_start_req_active

Robot3가 다시 Infeed 영역을 벗어나 Clear가 ON되면:

i_clear_of_infeed = 1
    -> z_permit_r3_sc1_start = 1
    -> permit_run_forward = 1
    -> 현재 var_cmd_speed에 맞는 전압 재출력
    -> SC1 자동 재전진

이것이 “깔딱하고 잠시 멈췄다가 조건이 돌아오면 자동으로 다시 가는”
기존 동작의 프로그램상 경로이다.

정확한 구분:
- active가 모터를 직접 돌리는 것은 아니다.
- pending/active와 SFC가 미완료 사이클을 기억한다.
- permit_run_forward가 복구되면 BasicControl이 전압을 다시 출력한다.

[아직 현장 Trend로 최종 증명할 항목]

Clear OFF -> permit_run_forward OFF -> var_volts_velocity 0이
실제 깔딱 순간마다 동일하게 발생하는지는 아래 Tag를 같은 10 ms Trend에서
확인해야 최종 원인으로 확정할 수 있다.

- i_clear_of_infeed
- permit_run_forward
- var_cmd_speed
- var_volts_velocity
- var_counts_accum_32
- State_Forward_Fast_To_Slowdown.X
- State_Forward_Slow_To_Creep.X
- State_Forward_Slow_To_Stop.X

8A.5 이번 HMI Enable=1 Gate가 하는 일

시험안은 기존의 자동 재전진 기능을 삭제하지 않는다.
Robot3가 너무 일찍 들어와 permit_run_forward를 끊는 상황 자체를
SC1 전진 완료 전까지 예방하는 시험이다.

sc1_hmi_enable = 1
AND z_mode_automatic = 1
AND sc1_start_req_active = 1
    -> z_permit_sc1_r3_unload 신규 허가 차단

예상 흐름:

SC1 전진 시작
    -> active = 1
    -> Robot3 신규 Unload 진입 차단
    -> i_clear_of_infeed 유지
    -> permit_run_forward 유지
    -> SC1이 목표 위치까지 연속 전진
    -> State_Stop 및 목표 Count 도달
    -> active = 0
    -> 추가 Robot Gate 해제
    -> 나머지 기존 조건이 맞을 때 Robot3 진입

“active=0에서 기존 Robot 진입 복원”의 정확한 의미:
- Robot3를 무조건 작동시키는 것이 아니다.
- 이번에 추가한 active 차단만 해제한다는 뜻이다.
- 기존 interlock_stopped, System Running/slowdown,
  i_sheet_not_at_transfer, Robot Clear, Gripper 조건은 그대로 만족해야 한다.

8A.6 전체 시간 순서

| 순서 | SC1 상태 | pending | active | Robot 신규 진입 |
| --- | --- | --- | --- | --- |
| 1 | Idle 대기 | 0 | 0 | 기존 조건대로 가능 |
| 2 | SM Drop 요청 접수 | 1 | 0 | 기존 조건대로 가능 |
| 3 | 시작 조건 대기 | 1 | 0 | 기존 Sheet Pick을 위해 가능 |
| 4 | Forward Step 실제 진입 | 1 | 1 | enable=1 AUTO에서 차단 |
| 5 | 고속/저속/감속/정지 접근 | 1 | 1 | 계속 차단 |
| 6 | 목표 Count 도달 및 State_Stop | 1→0 | 1→0 | 추가 차단 해제 |
| 7 | 이동 완료 후 Robot Pick | 0 | 0 | 기존 조건대로 가능 |

8A.7 중요한 주의점

1) active=1은 “물리적으로 계속 회전 중”이 아니라
   “전진 사이클 시작 후 정상 완료 전”을 뜻한다.

2) 깔딱이나 다른 인터록으로 체인이 잠시 멈춰도 완료 조건이 아니면
   active는 계속 1일 수 있다.

3) enable=1 AUTO에서 active가 비정상적으로 오래 1이면 Robot도 오래 차단된다.
   이때 active를 Force 또는 임의 Unlatch하지 말고 SC1 미완료 원인을 확인한다.

4) enable=0에서는 XIO(sc1_hmi_enable)로 전체 추가 Gate를 우회하므로
   위 active 값이 Robot3 Rung 6 출력에 영향을 주지 않는다.

5) 이번 active Gate는 원인 확인을 위한 보수적 1차 시험안이다.
   SC1 완전 완료까지 Robot 진입을 기다리므로 Cycle Time이 증가할 수 있다.

6) enable=1 시험으로 깔딱 제거가 확인된 뒤에만
   State_Forward_Slow_To_Stop 등 더 이른 안전 허가 시점으로 당길 수 있는지
   별도 Trend와 현장 안전 확인을 거쳐 후속 계획을 세운다.


## 8B. XIO 병렬 OR Gate 상세 설명


8B.1 설명 대상 Neutral Text


```text
[XIC(interlock_stopped),XIC(z_System_Running.X)XIC(permit_sc1_r3_slowdown)]XIO(i_sheet_not_at_transfer)[XIO(sc1_hmi_enable),XIO(z_mode_automatic),XIO(sc1_start_req_active)]OTE(z_permit_sc1_r3_unload);
```

이 Rung의 마지막 병렬 조건은 다음 세 XIO 접점이다.

[
 XIO(sc1_hmi_enable),
 XIO(z_mode_automatic),
 XIO(sc1_start_req_active)
]

세 접점은 병렬이므로 OR 조건이 맞다.
세 접점 중 하나라도 참이면 병렬 구간을 통과한다.

다만 중요한 점은 접점이 모두 XIO라는 것이다.

8B.2 XIO의 Tag 값과 접점 상태

XIO(tag)는 tag가 0일 때 참이고, tag가 1일 때 거짓이다.

| Tag 값 | XIO 접점 상태 | Rung 통과 |
| --- | --- | --- |
| 0 | TRUE / 닫힘 | 통과 |
| 1 | FALSE / 열림 | 차단 |

따라서 “Tag 하나가 켜지면 OR 경로가 통과한다”가 아니다.
정확한 표현은 다음과 같다.

“세 Tag 중 하나라도 0이면 해당 XIO 접점이 참이 되어 OR 경로가 통과한다.”

Studio 5000 Online 화면에서도 Tag 값과 접점의 녹색 표시를 구분해야 한다.
- Tag가 0인데 XIO 접점은 녹색으로 통과할 수 있다.
- Tag가 1이면 해당 XIO 접점은 열려 통과하지 못한다.

8B.3 논리식

병렬 XIO 구간은 다음 논리식이다.

(NOT sc1_hmi_enable)
OR
(NOT z_mode_automatic)
OR
(NOT sc1_start_req_active)

드모르간 법칙으로 정리하면:

NOT(
    sc1_hmi_enable
    AND z_mode_automatic
    AND sc1_start_req_active
)

따라서 세 Tag가 모두 1일 때만 병렬 XIO 구간 전체가 거짓이 된다.

정확한 운전 의미:

sc1_hmi_enable = 1
AND z_mode_automatic = 1
AND sc1_start_req_active = 1
    -> 세 XIO 접점 모두 열림
    -> 추가 Gate 차단
    -> z_permit_sc1_r3_unload 신규 허가 차단

그 외 조합:
    -> 세 XIO 중 하나 이상 닫힘
    -> 추가 Gate 통과
    -> 기존 Robot 허가 조건을 그대로 평가

주의:
“세 조건이 모두 성립해야 Robot이 진입한다”는 설명은 틀리다.
정확한 설명은 다음과 같다.

“세 조건이 모두 1일 때만 Robot3 신규 진입을 차단한다.”

8B.4 전체 진리표

아래 표는 Rung 앞부분의 기존 조건이 이미 모두 참이라고 가정한 것이다.

| HMI | AUTO | active | XIO HMI | XIO AUTO | XIO active | 추가 Gate | 결과 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 1 | 1 | 1 | 통과 | 기존 Robot 조건 적용 |
| 0 | 0 | 1 | 1 | 1 | 0 | 통과 | 기존 Robot 조건 적용 |
| 0 | 1 | 0 | 1 | 0 | 1 | 통과 | 기존 Robot 조건 적용 |
| 0 | 1 | 1 | 1 | 0 | 0 | 통과 | 기존 Robot 조건 적용 |
| 1 | 0 | 0 | 0 | 1 | 1 | 통과 | 기존 Robot 조건 적용 |
| 1 | 0 | 1 | 0 | 1 | 0 | 통과 | 기존 Robot 조건 적용 |
| 1 | 1 | 0 | 0 | 0 | 1 | 통과 | 기존 Robot 조건 적용 |
| 1 | 1 | 1 | 0 | 0 | 0 | 차단 | Robot 신규 진입 차단 |

8B.5 주요 상태별 설명

[HMI Enable=0]

sc1_hmi_enable = 0
    -> XIO(sc1_hmi_enable) = TRUE
    -> 추가 Gate 통과

AUTO/MANUAL/OFF 및 active 값과 관계없이 개선 Gate를 우회한다.
따라서 enable=0에서는 Cathode1(260714).L5X 원본 Rung 6과 동일하다.

[HMI Enable=1, AUTO=0]

z_mode_automatic = 0
    -> XIO(z_mode_automatic) = TRUE
    -> 추가 Gate 통과

Manual 또는 Off에서는 active 값과 관계없이 추가 Gate를 우회한다.

[HMI Enable=1, AUTO=1, active=0]

sc1_start_req_active = 0
    -> XIO(sc1_start_req_active) = TRUE
    -> 추가 Gate 통과

이 상태는 다음 경우를 포함할 수 있다.
- 정상 Idle 대기
- SM 요청은 pending이지만 SC1이 아직 출발하지 않은 상태
- SC1 목표 이동과 State_Stop 완료 후 상태

추가 Gate가 통과해도 Robot을 무조건 작동시키는 것은 아니다.
Rung 앞부분의 기존 interlock, slowdown/System Running,
Sheet 존재 조건과 Robot3 자체 조건이 모두 맞아야 실제 Robot이 진입한다.

[HMI Enable=1, AUTO=1, active=1]

XIO(sc1_hmi_enable)       = FALSE
XIO(z_mode_automatic)     = FALSE
XIO(sc1_start_req_active) = FALSE

세 병렬 경로가 모두 열리므로 추가 Gate가 차단된다.
이때 z_permit_sc1_r3_unload는 OFF되고 Robot3 신규 Unload 진입을 막는다.

8B.6 전체 Rung을 단계별로 읽는 방법

1단계: 기존 정지/운전 허가

[
 XIC(interlock_stopped),
 XIC(z_System_Running.X) XIC(permit_sc1_r3_slowdown)
]

다음 중 하나가 참이어야 한다.
- SC1이 기존 interlock_stopped 조건을 만족함
- System Running이고 기존 Robot slowdown 허가가 있음

2단계: 전송 위치 Sheet 존재

XIO(i_sheet_not_at_transfer)

i_sheet_not_at_transfer는 부정 명칭이므로 XIO가 참이면
전송 위치에 Sheet가 있다는 의미이다.

3단계: HMI Enable=1 시험용 추가 Gate

[
 XIO(sc1_hmi_enable),
 XIO(z_mode_automatic),
 XIO(sc1_start_req_active)
]

enable=1 + AUTO=1 + active=1일 때만 차단한다.

4단계: Robot3 Unload 허가 출력

OTE(z_permit_sc1_r3_unload)

1~3단계를 모두 통과해야 출력이 ON된다.

최종 논리식:

z_permit_sc1_r3_unload =
    기존_Rung6_허가
    AND Sheet_전송위치_존재
    AND NOT(sc1_hmi_enable AND z_mode_automatic AND sc1_start_req_active)

8B.7 최종 표현

잘못 이해하기 쉬운 표현:
- “enable, AUTO, active가 모두 성립할 때 Robot이 진입한다.”

정확한 표현:
- “enable, AUTO, active가 모두 1일 때만 Robot 신규 진입을 차단한다.”
- “세 Tag 중 하나라도 0이면 추가 Gate는 통과한다.”
- “추가 Gate 통과는 Robot 강제 진입이 아니라 기존 허가 조건 복원이다.”


## 9. 파라미터 처리


Cathode1(260714).L5X의 현재 값:

param_offset              = 9450
param_offset_creep        = 8200
param_offset_highspd      = 6700
param_volts_fwd_highspd   = 5.6
param_volts_fwd_lowspd    = 2.87
param_volts_fwd_creep     = 3.2
param_volts_forward_homing= 3.0

1차 적용에서는 위 값을 모두 유지한다.

이유:
- CSV에서 먼저 확인된 문제는 거리/속도 값 자체보다 Robot 허가의 선행이다.
- Logic과 Parameter를 동시에 바꾸면 깔딱 제거 원인을 분리할 수 없다.
- 최종 Gate를 검증한 후에도 Cycle Time 개선이 필요할 때만 별도 Trend로 조정한다.


## 10. Studio 5000 적용 전 절차


1) Online Controller에서 현재 Permits Rung 6을 L5X 또는 Routine으로 Export한다.
2) Controller Project 전체 백업을 별도 이름으로 저장한다.
3) 현재 사진 로직과 실제 Online Neutral Text가 같은지 확인한다.
4) 1차 HMI Enable 시험본은 Rung 6 한 곳에만 반영한다.
5) Verify Routine을 수행한다.
6) Verify Program을 수행한다.
7) Cross Reference로 z_permit_sc1_r3_unload writer가 의도한 한 곳인지 확인한다.
8) Force가 걸린 관련 Tag가 없는지 확인한다.
9) Robot/Conveyor 안전구역을 비우고 저속 또는 승인된 시험 모드로 시작한다.


## 11. Trend 구성 - 창당 최대 8 Tag


[Trend Window A - 핵심 원인 검증]

1. sc1_hmi_enable
2. z_mode_automatic
3. Program:Sheet_Conveyor_1\sc1_start_req_active
4. z_permit_sc1_r3_unload
5. Program:Robot3\i_clear_of_infeed
6. Program:Sheet_Conveyor_1\permit_run_forward
7. Program:Sheet_Conveyor_1\State_Stop.X
8. Program:Sheet_Conveyor_1\i_sheet_not_at_transfer

[Trend Window B - 시작/완료 체인 검증]

1. z_signal_sm1_sc1_start
2. z_signal_sm2_sc1_start
3. Program:Sheet_Conveyor_1\sc1_start_req_pending
4. Program:Sheet_Conveyor_1\permit_start
5. Program:Sheet_Conveyor_1\permit_sc1_r3_slowdown
6. Program:Sheet_Conveyor_1\interlock_stopped
7. Program:Sheet_Conveyor_1\var_counts_accum_32
8. Program:Sheet_Conveyor_1\var_counts_target

권장 Sample Period: 10 ms


## 12. 필수 시험 시나리오


시험 1: sc1_hmi_enable=0 / 원본 회귀시험
- AUTO, MANUAL, OFF에서 Rung 6 동작이 원본과 같은지 확인한다.
- active=1이어도 추가 Gate 때문에 z_permit_sc1_r3_unload가 차단되면 안 된다.
- enable=0에서 깔딱 제거 여부를 판정하지 않는다.
- 목적은 수정 OFF 시 기존 동작 100% 유지 확인이다.

시험 2: sc1_hmi_enable=1 / AUTO / SM1 Drop
- active=1 동안 z_permit_sc1_r3_unload=0인지 확인한다.
- active=1 동안 i_clear_of_infeed가 신규 Robot 호출 때문에 꺼지지 않는지 확인한다.
- active=0 이후 전송 위치 Sheet가 있으면 Robot 허가가 정상 복원되는지 확인한다.
- 최소 10 Cycle 반복한다.

시험 3: sc1_hmi_enable=1 / AUTO / SM2 Drop
- 시험 2와 동일하게 최소 10 Cycle 반복한다.

시험 4: sc1_hmi_enable=1 / 전송 위치에 기존 Sheet가 있는 상태에서 새 SM Drop 요청
- pending=1, active=0에서 Robot이 기존 Sheet를 정상 Pick하는지 확인한다.
- 기존 Sheet 제거 후 SC1이 정상 시작하는지 확인한다.
- 상호 대기나 active 미생성이 없는지 확인한다.

시험 5: sc1_hmi_enable=1 / MANUAL
- 기존 Manual Robot 진입과 수동 Conveyor 조작이 그대로 되는지 확인한다.
- active 잔류가 있어도 추가 Gate가 Manual을 막지 않는지 확인한다.

시험 6: sc1_hmi_enable=1 / OFF
- 기존 OFF 상태의 Robot 진입/복구 절차가 그대로 되는지 확인한다.
- 기존 안전 절차를 벗어난 강제 동작은 하지 않는다.

시험 7: sc1_hmi_enable=1 / AUTO 이동 도중 MANUAL 또는 OFF 전환
- 기존 interlock_stopped가 만족되기 전 Robot이 위험하게 진입하지 않는지 확인한다.
- 정지 후 기존 복구 절차가 가능한지 확인한다.

시험 8: sc1_hmi_enable=1 / Single Cycle 및 Reset/Home Recovery
- Single Cycle이 기존 방식대로 가능한지 확인한다.
- Reset/Home 후 Sheet 위치, Grade, Tracking Data가 실제 위치와 일치하는지 확인한다.

시험 후 결정 Gate:
- enable=1 AUTO에서 깔딱이 사라지고 모든 정합성 시험이 합격하면
  해당 Trend를 근거로 후속 수정/적용 계획을 새로 작성한다.
- 깔딱이 계속되면 enable=0 적용으로 확대하지 않는다.
  Robot Clear 외 다른 차단 조건과 실제 Output/Position을 다시 추적한다.


## 13. 합격 기준


필수 합격:

1) enable=0에서는 모든 모드에서 Rung 6이 원본과 동일하게 동작한다.
2) enable=1 + AUTO + active=1 동안 z_permit_sc1_r3_unload가 0이다.
3) enable=1에서 SC1 완료 전 신규 Robot 진입으로 i_clear_of_infeed가 꺼지지 않는다.
4) enable=1 + active=0 이후 기존 Robot3 진입이 정상 복원된다.
5) enable=1의 MANUAL/OFF에서 Robot3 진입과 Recovery가 기존과 동일하다.
6) enable=1에서 SM1/SM2 각각 연속 10 Cycle 이상 깔딱이 재현되지 않는다.
7) 실제 Sheet 위치, Grade, a_cathode Data, Tracking 위치가 일치한다.
8) Robot과 Conveyor의 물리적 간섭, 새 Fault, Alarm, Cycle 정지가 없다.

즉시 중단/원복 조건:

1) enable=0에서 원본과 다른 Robot 허가 동작이 발생한다.
2) enable=1 + AUTO + active=1인데 z_permit_sc1_r3_unload가 1이 된다.
3) enable=1 + active=0 이후에도 Robot 허가가 복원되지 않는다.
4) 기존 Sheet가 전송 위치에 있을 때 Robot과 SC1이 서로 기다린다.
5) MANUAL/OFF/Reset/Home Recovery가 기존과 달라진다.
6) Sheet/Grade/Tracking Data가 어긋나거나 안전거리가 불확실하다.


## 14. 최종 적용 판단


[1차 시험안으로 확정]
- 원인 방향: Robot3 Unload 허가가 SC1 active 완료보다 먼저 발생한다.
- 수정 위치: Sheet_Conveyor_1 / Permits / Rung 6 한 곳.
- 수정 방법: sc1_hmi_enable=1 + AUTO + sc1_start_req_active 동안만
  신규 Robot3 Unload 허가 차단.
- sc1_hmi_enable=0: L5X 원본과 동일한 경로 유지.
- 유지 조건: interlock_stopped, z_System_Running.X,
  permit_sc1_r3_slowdown, i_sheet_not_at_transfer 모두 유지.
- Robot3 LS 수정 없음.
- SC1 Parameter 1차 수정 없음.

[아직 미확정]
- 실제 깔딱이 100% 제거되는지.
- enable=1 시험 성공 후 후속 수정 범위를 어디까지 적용할지.
- Cycle Time 증가량이 생산 허용 범위인지.
- 실제 Robot/Conveyor 안전거리.

따라서 이 안은 “sc1_hmi_enable=1 전용 1차 현장 시험안”으로 채택한다.
enable=1 시험에서 깔딱이 없어지고 모든 정합성 시험이 합격한 뒤에만
후속 수정 계획을 별도로 작성한다. 현재 단계에서 enable=0 동작은 변경하지 않는다.
