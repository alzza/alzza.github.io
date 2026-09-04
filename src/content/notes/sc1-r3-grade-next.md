---
title: SC1 깔딱이 약 97% 줄어든 뒤, 전기동 한 장의 등급만 비는 경우
date: "2026-09-04"
excerpt: Unload 허가를 정지 뒤로 옮긴 뒤 홈 속도로 계속 가는 증상은 없어졌다. 남는 약 3%는 전기동 한 장의 등급만 비는 경우다. Trend는 창마다 태그 8개로 나눠 동시에 띄운다.
kicker: PLC
tags: ["PLC", "SC1"]
---

관련 문서: [통합 설명](/plc/timing/) · [1차 시험안](/plc/)

Unload 허가를 체인이 정지한 뒤로 옮긴 뒤, 현장에서는 증상이 약 97% 줄었다고 본다. 체인이 홈 속도로 계속 가는 일은 없고, 등급이 여러 장에 걸쳐 연속으로 비지도 않는다. 가끔 해당 전기동 한 장의 등급만 없다.

이 남는 증상은, 감속 중에 Unload가 나가서 `ULOD_INF` 14번이 Clear를 끄던 경로가 막힌 뒤에 남는 데이터 이동 문제다. Unload 렁을 더 엄격하게 만들거나 로봇 LS를 고치는 일이 지금은 우선이 아니다.

## 이전과 지금

| 항목 | 이전 | 지금 |
|---|---|---|
| 체인 | 감속 중에 Unload가 나가면 14번이 체인을 잘못된 자리에 고정한다. | 정지한 뒤에 Unload가 나간다. 깔딱은 거의 보이지 않는다. |
| 속도 | 인덱스를 놓친 뒤 홈 속도로 계속 간다. | 홈 속도로 계속 가는 증상은 없다. |
| 등급 | 여러 장의 등급이 연속으로 비었다. | 전기동 한 장의 등급만 빈다. |

등급 배열은 체인이 한 칸 움직였다고 해서 같이 움직이지 않는다. `sc1_hmi_enable`이 0이면 `i_Sheet1_Speed_Ref`가 2000을 넘는 상태가 한동안 이어질 때 `Track[11]`이 나간다. `sc1_hmi_enable`이 1이면 Track은 속도 신호가 아니라, 정지 스텝이고 armed가 켜져 있으며 적산 카운트가 목표에 도달했을 때 나간다. Track이 나가면 체인16번부터 체인24번까지를 한 칸 밀고, 체인16번은 0으로 비운다. 전기동이 정확히 한 칸을 가지 않았는데도 이 신호가 한 번 더 나가면, Weight가 0인 칸이 체인24번(로봇3번 픽업)까지 밀려 온다. 그래서 전기동 한 장의 등급만 사라진 것처럼 보인다.

## 한 장의 등급이 빈 원인을 나누는 표

다음 수정을 넣기 전에, 10 ms Trend로 등급이 빈 그 한 장만 본다. 원인을 가리기 전에는 로직을 더 넣지 않는다.

| 그 순간에 같이 1인 신호 | 원인 |
|---|---|
| `Track[11]` 횟수가 드롭보다 1회 많고, 체인16번 Weight가 0인 채로 시프트된다. | enable이 0이면 짧은 속도 피크가 Track을 한 번 더 내보낸다. enable이 1이면 정지와 armed와 카운트가 한 번 더 맞아서 시프트가 나간다. |
| 같은 드롭에서 `permit_start`가 두 번 나가고, `pending`이 1인 채로 다시 출발한다. | pending이 출발을 한 번 더 밀어서 시프트가 두 번 나간다. |
| `Open_Gate` 명령이 1에서 0으로 바뀌고, 체인16번 또는 체인20번 Serial이 0이 아니다. 또는 그 순간에 `z_sc1_moving`이 1이다. | 드롭 복사를 건너뛰고 명령만 지운다. 그 전기동의 등급은 다시 들어가지 않는다. |

## 10 ms Trend 창 나누기

Studio 5000 Trend는 한 창에 태그를 최대 8개까지만 넣을 수 있다. 창을 여러 개 띄우는 것은 되므로, 아래 네 창을 **같은 시각**, **Sample Period 10 ms**로 동시에 연다. 한 창에 아홉 개를 넣지 않는다.

프로그램 스코프 태그는 Trend에서 `Sheet_Conveyor_1.태그이름`처럼 프로그램 이름을 앞에 붙인다. `Robot3.i_clear_of_infeed`와 `Robot1.i_Sheet1_Speed_Ref`도 같다. 컨트롤러 태그는 프로그램 이름 없이 넣는다. Digital은 BOOL, Analog는 숫자 태그다.

네 창을 같이 보는 이유는, Track이 과다한지, pending이 재출발했는지, Open_Gate가 복사를 건너뛰었는지를 한 장의 소실 시각에 맞춰 가리기 위해서다.

### 창 1. 속도 Track이 드롭보다 많은지

짧은 속도 피크가 `Track[11]`을 한 번 더 내보냈는지 시험한다. 이 경로는 `sc1_hmi_enable`이 0일 때만 성립한다. 속도가 2000을 넘는 상태는 100 ms 이상 유지되어야 신호가 선다. 아날로그 두 개와 디지털 여섯 개다.

| 번호 | 프로그램 | 태그 | Digital / Analog | 이 태그로 확인하는 내용 |
|---|---|---|---|---|
| 1 | Sheet_Conveyor_1 | `sc1_hmi_enable` | Digital | 시험 중 값이 1인지 확인한다. 0이면 Unload가 원본 조건으로 돌아가고, 속도 경로로 Track이 나간다. |
| 2 | Robot1 | `i_Sheet1_Speed_Ref` | Analog | 속도가 2000을 넘긴 피크가 100 ms 이상 있었는지 확인한다. |
| 3 | Sheet_Conveyor_1 | `var_volts_velocity` | Analog | 명령 전압이 실제로 나갔는지 확인한다. |
| 4 | 컨트롤러 | `z_sc1_data_move_signal` | Digital | 속도 경로가 Track을 걸었는지 확인한다. enable이 1이면 이 비트만으로 Track이 나가지 않는다. |
| 5 | 컨트롤러 | `z_Tracking_Commands[11]` | Digital | 체인16번에서 체인24번으로 시프트가 나갔는지 확인한다. |
| 6 | Sheet_Conveyor_1 | `State_Stop.X` | Digital | 정지 스텝에 들어가 있었는지 확인한다. enable이 1이면 Track 조건의 하나다. |
| 7 | Sheet_Conveyor_1 | `permit_start` | Digital | 그 피크와 같은 시각에 기동이 있었는지 확인한다. |
| 8 | 컨트롤러 | `z_sc1_moving` | Digital | 체인이 움직이는 중에 Track이 나갔는지 확인한다. |

### 창 2. 한 드롭에서 출발이 두 번인지

`pending`이 Clear가 풀린 뒤에 기동을 한 번 더 밀었는지 본다. 디지털만 여덟 개다.

| 번호 | 프로그램 | 태그 | Digital / Analog | 이 태그로 확인하는 내용 |
|---|---|---|---|---|
| 1 | Sheet_Conveyor_1 | `sc1_hmi_enable` | Digital | enable이 1인 동안에 pending이 출발 식에 들어가는지 확인한다. |
| 2 | Sheet_Conveyor_1 | `permit_start` | Digital | 한 드롭에서 기동 펄스가 두 번 나갔는지 확인한다. |
| 3 | Sheet_Conveyor_1 | `sc1_start_req_pending` | Digital | 요청이 래치된 채로 남았는지 확인한다. |
| 4 | Sheet_Conveyor_1 | `sc1_start_req_active` | Digital | 미완료 사이클이 유지되는지 확인한다. |
| 5 | Robot3 | `i_clear_of_infeed` | Digital | Clear가 끊겼다가 다시 켜진 뒤에 재출발했는지 확인한다. |
| 6 | Sheet_Conveyor_1 | `permit_run_forward` | Digital | Clear가 0일 때 전진 허가가 끊기는지 확인한다. |
| 7 | 컨트롤러 | `z_Tracking_Commands[11]` | Digital | 재출발과 함께 Track이 한 번 더 나갔는지 확인한다. |
| 8 | Sheet_Conveyor_1 | `State_Stop.X` | Digital | 정지 뒤에 다시 출발했는지 확인한다. |

### 창 3. Open_Gate 복사가 됐는지

드롭 순간에 체인이 움직였거나, 도착 칸이 비어 있지 않아서 복사를 건너뛰었는지 본다. 실제 복사는 `z_Tracking_Commands[9]`와 `[10]`이고, 도착 칸 Serial이 0이며 `z_sc1_moving`이 꺼져 있을 때만 복사한 뒤 명령을 0으로 만든다. 아래 드롭 허가는 그 명령을 대신 보는 신호다.

| 번호 | 프로그램 | 태그 | Digital / Analog | 이 태그로 확인하는 내용 |
|---|---|---|---|---|
| 1 | 컨트롤러 | `z_sc1_moving` | Digital | Open_Gate 순간에 체인이 움직였는지 확인한다. 움직이면 복사를 미룬다. |
| 2 | Sheet_Conveyor_1 | `f_indexed_for_sm1` | Digital | SM1 칸에 섰을 때만 1인지 확인한다. |
| 3 | 컨트롤러 | `z_permit_sc1_sm1_drop` | Digital | SM1 드롭 허가가 나갔는지 확인한다. |
| 4 | 컨트롤러 | `z_permit_sc1_sm2_drop` | Digital | SM2 드롭 허가가 나갔는지 확인한다. |
| 5 | Cathode_Tracking | `a_cathode[9].Weight` | Analog | 칸9, SM1 위 등급이 드롭 전에 있는지 확인한다. |
| 6 | Cathode_Tracking | `a_cathode[12].Weight` | Analog | 칸12, SM2 위 등급이 드롭 전에 있는지 확인한다. |
| 7 | Cathode_Tracking | `a_cathode[16].Weight` | Analog | 체인16번에 칸9 등급이 복사됐는지 확인한다. |
| 8 | Cathode_Tracking | `a_cathode[20].Weight` | Analog | 체인20번에 칸12 등급이 복사됐는지 확인한다. |

칸11까지는 보이다가 드롭 뒤에 비면, 11에서 7을 거쳐 9로 옮긴 것은 정상일 수 있다. 창 3에서 칸9 또는 칸12의 Weight가 있는데 체인16번 또는 체인20번이 0이면, 복사가 안 된 것이다.

### 창 4. 체인24번과 Serial

로봇3번 픽업 칸에서 등급이 0이 된 경로와, 도착 칸 Serial이 남아 복사가 거절됐는지를 본다.

| 번호 | 프로그램 | 태그 | Digital / Analog | 이 태그로 확인하는 내용 |
|---|---|---|---|---|
| 1 | Cathode_Tracking | `a_cathode[9].Serial` | Analog | 칸9에 전기동 식별이 남아 있는지 확인한다. |
| 2 | Cathode_Tracking | `a_cathode[12].Serial` | Analog | 칸12에 전기동 식별이 남아 있는지 확인한다. |
| 3 | Cathode_Tracking | `a_cathode[16].Serial` | Analog | 체인16번 도착 칸이 비어 있었는지 확인한다. 0이 아니면 복사가 거절된다. |
| 4 | Cathode_Tracking | `a_cathode[20].Serial` | Analog | 체인20번 도착 칸이 비어 있었는지 확인한다. |
| 5 | Cathode_Tracking | `a_cathode[24].Weight` | Analog | 체인24번, 로봇3번 픽업 등급이 0인지 확인한다. |
| 6 | Cathode_Tracking | `a_cathode[24].Serial` | Analog | 체인24번에 전기동이 있는 것처럼 보이는 식별이 있는지 확인한다. |
| 7 | 컨트롤러 | `z_sc1_R3_Grade` | Analog | PLC가 로봇에 넘겨 주는 등급이 0인지 확인한다. 시프트 직후 체인24번 Weight다. |
| 8 | 컨트롤러 | `z_Tracking_Commands[11]` | Digital | 그 0이 시프트 한 번과 같이 왔는지 확인한다. |

Open_Gate 명령 비트의 태그 이름이 현장 프로젝트에서 다르면, 창 3의 드롭 허가 네 개 자리에 그 명령 비트를 넣는다. 한 창이 여덟 개를 넘기면 안 된다.

## 현장 피드백: 등급이 전부 비고, 체인 홈위치가 세 번 안 된 경우

한 장만 비는 경우와 다르다. 등급 배열이 한 번에 비었는지, 홈 시퀀스가 인덱스 센서를 못 넘겼는지를 같이 본다. Studio 5000 Trend는 창마다 태그 8개다. 아래 네 창을 같은 시각, 10 ms로 연다. 프로그램 위치와 Digital / Analog는 창 1부터 4까지와 같다.

홈은 `Sheet_Conveyor_1`의 `DoHoming`이고, 수동 모드에서만 JSR한다. 인덱스 `i_conveyor_index`가 켜져 있으면 `Home_Reset_Start`에서 속도 3으로 찾고, 인덱스가 꺼지면 `Home_Search_Position_Zero`로 넘어가 `ui_o_conveyor_homed`를 1로 만든다. `z_alarm_sc1_not_homed`는 홈이 아닌 동안 계속 1이라, 세 번을 세려면 `ui_o_homing_in_progress`가 1로 올라간 횟수와 시작 버튼을 같이 본다.

홈 중에 속도가 2000을 넘는다고 해서, enable이 1일 때 `z_sc1_data_move_signal`이 `Track[11]`을 걸지는 않는다. enable이 0일 때만 그 속도 경로가 Track을 건다. enable이 1이면 Track은 정지와 armed와 카운트다. 홈은 `DoHoming`이라 `State_Forward_Fast_To_Flag`를 타지 않으므로, 홈 자체가 armed를 걸지는 않는다. 창 B는 홈 시각에 Track이 나갔는지를 시험하는 창이지, 홈 속도가 원인을 이미 증명하는 창이 아니다.

### 창 A. 체인 홈이 세 번 실패했는지

디지털만 여덟 개다.

| 번호 | 프로그램 | 태그 | Digital / Analog | 이 태그로 확인하는 내용 |
|---|---|---|---|---|
| 1 | Sheet_Conveyor_1 | `ui_o_homing_in_progress` | Digital | 홈 시도가 몇 번 올라갔는지 센다. SFR로 다시 걸면 이미 1인 채로 남을 수 있어, 시작 비트도 같이 본다. |
| 2 | Sheet_Conveyor_1 | `ui_o_conveyor_homed` | Digital | 홈이 성공해서 1이 됐는지 확인한다. 리셋과 수동 전후진과 `DoResetHoming`에서 0이 된다. |
| 3 | Sheet_Conveyor_1 | `Home_Stop.X` | Digital | 홈 시퀀스가 끝났는지 확인한다. 이 비트가 1이면 `in_progress` OTE가 끊긴다. |
| 4 | Sheet_Conveyor_1 | `Home_Search_Position_Zero.X` | Digital | 인덱스를 넘겨 성공 스텝에 들어갔는지 확인한다. 찾는 동안은 `Home_Reset_Start`다. 실패하면 이 비트는 0으로 남는다. |
| 5 | Sheet_Conveyor_1 | `i_conveyor_index` | Digital | 인덱스를 넘겼는지 확인한다. 1로 남아 있으면 속도 3으로 계속 찾는다. |
| 6 | Sheet_Conveyor_1 | `timer_homing.DN` | Digital | 설정값 60초가 지났는지 확인한다. 이 L5X의 SC1은 빈 분기 때문에 DN이 `in_progress`를 끊지 않는다. DN이 1이라고 해서 홈이 끝난 것은 아니다. |
| 7 | Sheet_Conveyor_1 | `ui_i_start_homing` | Digital | 현장에서 홈을 누른 횟수를 센다. 세 번을 세는 데는 이 비트가 더 직접적이다. |
| 8 | 컨트롤러 | `z_ui_i_home_all` | Digital | 전체 홈으로 같은 SFR이 나갔는지 확인한다. |

`ui_o_homing_in_progress`가 1로 올라간 횟수가 3이면 홈을 세 번 시도한 것이다. 그 구간에서 `i_conveyor_index`가 1로 갔다가 0으로 안 떨어지면, 인덱스를 못 넘긴 것이다. `timer_homing.DN`이 1이어도 SC1에서는 홈 진행이 자동으로 끝나지 않을 수 있으므로, 시작 버튼과 `Home_Stop.X`를 같이 본다.

### 창 B. 홈 중에 Track이 나갔는지

아날로그 네 개, 디지털 네 개다. 등급이 전부 빈 시각과 홈 시도를 겹쳐 본다. 속도가 2000을 넘긴 뒤에 Track이 나갔는지는 시험하되, enable이 1이면 그 속도 신호가 Track의 원인이 아니다.

| 번호 | 프로그램 | 태그 | Digital / Analog | 이 태그로 확인하는 내용 |
|---|---|---|---|---|
| 1 | Sheet_Conveyor_1 | `var_volts_velocity` | Analog | 홈 전압이 나갔는지 확인한다. 속도 3은 `permit_run_forward` 또는 수동 모드일 때 홈 전압 3.0 V를 낸다. |
| 2 | Sheet_Conveyor_1 | `ic_conveyor_position` | Analog | 홈 중에 체인이 이동했는지 확인한다. Track의 원인은 아니다. |
| 3 | Sheet_Conveyor_1 | `var_cmd_speed` | Analog | 홈이면 인덱스가 켜져 있을 때 3인지 확인한다. |
| 4 | Robot1 | `i_Sheet1_Speed_Ref` | Analog | 아날로그가 2000을 넘겼는지 확인한다. enable이 1이면 Track 원인이 아니다. |
| 5 | 컨트롤러 | `z_sc1_data_move_signal` | Digital | 속도 경로가 섰는지 확인한다. enable이 0일 때만 이 비트가 Track을 건다. |
| 6 | 컨트롤러 | `z_Tracking_Commands[11]` | Digital | 시프트 펄스가 홈 시각과 겹치는지 확인한다. 시프트는 체인16번부터 체인24번까지를 밀고 체인16번을 비운다. |
| 7 | 컨트롤러 | `z_sc1_moving` | Digital | 명령 전압이 나가 체인이 움직이는지로 본다. 홈 3 V이면 1이 된다. Track 조건은 아니다. |
| 8 | Sheet_Conveyor_1 | `ui_o_homing_in_progress` | Digital | 그 Track이 홈 시도 중에 나갔는지 시각을 맞춘다. |

창 B만 보면 어느 Track 경로인지 구분할 수 없다. enable은 창 C의 `sc1_hmi_enable`로 본다. enable이 1일 때 Track의 실제 조건인 `sc1_data_move_armed`, `var_counts_accum_32`, `var_counts_target`는 이 여덟 개 안에 넣지 않았다. 그 경로를 보려면 창을 하나 더 열고, 한 창에 아홉 개를 넣지 않는다.

### 창 C. Clear와 Unload가 전진·홈을 끊었는지

디지털만 여덟 개다. Clear가 꺼지면 `z_permit_r3_sc1_start`와 `permit_run_forward`가 끊긴다. 자동에서 속도 1, 2, 3은 그 허가가 없으면 전압이 0이다. 크리프 속도 5는 그 허가 없이도 전압을 낸다. 홈은 수동에서 JSR하므로, 속도 3의 수동 분기가 살아 있으면 Clear가 꺼져도 홈 전압은 나간다. Clear가 홈을 끊는다는 말은 자동 전진에는 해당하고, 수동 홈에는 해당하지 않는다.

| 번호 | 프로그램 | 태그 | Digital / Analog | 이 태그로 확인하는 내용 |
|---|---|---|---|---|
| 1 | Robot3 | `i_clear_of_infeed` | Digital | 로봇 Clear가 꺼졌는지 확인한다. ULOD 14번이다. |
| 2 | 컨트롤러 | `z_permit_r3_sc1_start` | Digital | Clear의 PLC 쪽이 같이 꺼지는지 확인한다. |
| 3 | 컨트롤러 | `z_permit_sc1_r3_unload` | Digital | 픽 중에 Unload가 Clear를 끄는지 확인한다. 증상이 약 97% 줄어든 뒤에는 Stop에서만 켜져야 한다. |
| 4 | Sheet_Conveyor_1 | `permit_run_forward` | Digital | Clear가 자동 전진 허가를 끊는지 확인한다. |
| 5 | Sheet_Conveyor_1 | `permit_start` | Digital | 기동이 다시 나갔는지 확인한다. Clear와 `interlock_home`이 필요하고, enable이 1이면 pending도 들어간다. |
| 6 | Sheet_Conveyor_1 | `sc1_hmi_enable` | Digital | Track과 Unload가 어느 분기인지 확인한다. 창 B가 보지 못하는 분기다. |
| 7 | Sheet_Conveyor_1 | `State_Stop.X` | Digital | enable이 1일 때 Track과 Unload가 정지 스텝에 있었는지 확인한다. |
| 8 | Sheet_Conveyor_1 | `interlock_home` | Digital | 홈과 정지 인터록을 확인한다. 홈이 아니면 기동이 나가지 않는다. |

### 창 D. 등급이 한 번에 전부 0이 됐는지

아날로그 네 개, 디지털 네 개다. `Track_Sheet_Conv1_Index`는 체인16번부터 체인24번까지를 시프트한 뒤 `z_sc1_R3_Grade`에 체인24번 Weight를 넣는다. 체인16번, 체인20번, 체인24번 Weight가 Track 펄스와 함께 0으로 밀리면, 한 장 Open_Gate 실패가 아니라 시프트가 배열을 비운 것이다.

| 번호 | 프로그램 | 태그 | Digital / Analog | 이 태그로 확인하는 내용 |
|---|---|---|---|---|
| 1 | Cathode_Tracking | `a_cathode[16].Weight` | Analog | 체인16번 등급이 Track과 같이 0이 됐는지 확인한다. |
| 2 | Cathode_Tracking | `a_cathode[20].Weight` | Analog | 체인20번 등급이 같이 0이 됐는지 확인한다. |
| 3 | Cathode_Tracking | `a_cathode[24].Weight` | Analog | 체인24번, 로봇3번 픽업 등급이 같이 0이 됐는지 확인한다. |
| 4 | 컨트롤러 | `z_sc1_R3_Grade` | Analog | 로봇에 넘겨 주는 값이 0인지 확인한다. 시프트 직후 체인24번 Weight다. |
| 5 | 컨트롤러 | `z_Tracking_Commands[11]` | Digital | 시프트 시각을 확인한다. |
| 6 | 컨트롤러 | `z_sc1_data_move_signal` | Digital | 속도 Track인지를 확인한다. enable이 1이면 이 비트 없이도 Track이 나간다. |
| 7 | Sheet_Conveyor_1 | `sc1_start_req_pending` | Digital | 재출발이 추가 Track을 만드는지 확인한다. enable이 1이면 armed가 다시 걸릴 수 있다. |
| 8 | 컨트롤러 | `z_sc1_moving` | Digital | 이동 중에 Open_Gate 복사가 막혔는지 보조로 본다. Track[11]의 조건은 아니다. |

홈 시도와 등급 0이 같은 시각이어야 홈이 원인 후보가 된다. 홈 중에 Track이 나가지 않았다면, 등급이 전부 0이 된 원인은 홈 속도가 아니다. 그때는 정지 뒤에 Track이 더 나갔는지, pending이 재출발했는지, Open_Gate가 명령을 지우고 복사를 하지 않았는지를 본다.

## 원인별 다음에 고칠 방법

| 확인된 원인 | 고치는 방법 | 참고 |
|---|---|---|
| Track 횟수가 드롭보다 많다. | `enable=1`일 때만, 정지하고 목표 카운트에 도달한 뒤에 Track이 나가게 한다. | 이 경로는 enable이 1인 L5X에 이미 있다. Trend에서 그 경로가 한 번 더 나갔는지를 먼저 본다. |
| 위와 같고, 렁 구조는 그대로 두고 시험만 한다. | 속도 임계값 2000을 올리거나 Track용 TON을 늘린다. | enable이 0일 때만 속도 경로가 바뀐다. 느린 피치에서는 시프트가 늦어질 수 있다. |
| 위와 같고, 조건을 더 좁힌다. | Track 접점에 `State_Stop` 또는 `accum ≥ target`을 AND로 넣는다. | 정지 완료 후 시프트와 비슷하고, 손대는 범위는 더 좁다. |
| 한 드롭에서 출발이 두 번 나간다. | 같은 조건에서 enable을 짧게 OFF로 두고 비교한다. 소실이 줄면 pending이 원인이다. | OFF에서는 Unload가 감속 중에도 열리므로, 확인한 뒤에는 바로 ON으로 되돌린다. |
| pending이 원인으로 확인된다. | 이번 피치에서 Track이 이미 나갔으면 재출발하지 못하게 한다. | 깔딱이 거의 없으면 pending의 재시도가 한 장만 더 밀 수 있다. |
| Open_Gate가 복사하지 않고 꺼진다. | 복사가 끝날 때까지 명령을 남긴다. 다음 `permit_start`는 복사 후에 준다. | 실패했다고 명령을 바로 0으로 만들지 않는다. |

Open_Gate 타이머만 늘리는 방법은 쓰지 않는다. 인덱스를 놓친 SM1 드롭도, 감속 중에 나가는 Unload도 그 타이머로는 막히지 않는다.

## 아직 고치지 않는 것

| 고치지 않는 대상 | 이유 |
|---|---|
| 로봇 LS, `ULOD_INF` 14번의 Clear OFF, J를 L로 바꾸는 일 | 남은 약 3%의 우선 원인이 아니다. |
| SC1 오프셋과 전압을 먼저 바꾸는 일 | 홈 속도로 계속 가는 증상이 없어졌으면, 그 숫자가 고장난 것이 아니다. |
| Unload 렁을 더 엄격하게 만드는 일 | 남은 증상은 Unload 허가 렁이 소비하는 신호가 아니다. |
| 파라미터와 Track을 같은 날에 같이 바꾸는 일 | 무엇이 줄었는지 구분할 수 없다. |

## 추천하는 순서

1. 위 네 창을 같은 시각으로 맞춰, 한 장의 등급 소실이 Track이 과다한 경우인지, pending이 재출발한 경우인지, Open_Gate가 실패한 경우인지 확인한다.
2. 등급이 전부 비고 홈이 세 번 안 된 경우에는 창 A부터 D를 같이 본다. 홈 시각에 Track이 없으면 홈 속도를 원인으로 두지 않는다.
3. Track이 과다하면 `enable=1`에서만 정지 완료 후에 시프트하도록 저속으로 시험한다. 그 경로는 이미 있으므로, 한 번 더 나갔는지를 먼저 센다.
4. pending이 원인이면 enable을 짧게 OFF로 대조한 뒤, 재출발만 줄인다.
5. Open_Gate가 실패하면 명령을 유지하고, 복사가 끝난 뒤에 출발하게 한다.

정지 완료 후 시프트를 넣어도 모든 소실이 없어진다고 단정하지 않는다. 도착 칸 Serial이 남아 복사가 실패하는 경우는 Track과 별개로 남을 수 있다. 다만 지금처럼 한 장만 비고 홈 속도가 없는 패턴에서는, 속도 Track을 피치 완료 뒤에만 나가게 하는 방법을 먼저 시험하는 편이 맞다.
