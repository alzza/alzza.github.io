---
title: CSM#1 VISION 등급소실 동작흐름 Rev.3
date: "2026-09-30"
excerpt: 인피드 에러 뒤 R4를 조그로 비전 다이에 올리면 판정이 R1보다 먼저 끝날 수 있다. 오토와 매뉴얼은 같은 렁을 타고, 등급이 남는지는 그 0.7초가 집기와 겹치는지로 갈린다.
kicker: PLC
tags: ["PLC", "VISION", "Robot1", "Infeed", "CSM", "Timing"]
---

## 변경 이력

2026-09-30에 Rev.3을 올렸다. 인피드에서 에러가 난 뒤 R4를 조그로 비전 다이에 올리는 동작 전체를 적었다. 오토 중에 조그하는 경우와 라인 매뉴얼에서 조그하는 경우를 나누고, 등급이 남는 경우와 사라지는 경우를 구분했다. 확인용 CATHODE Trend는 창 둘이고 한 창의 펜은 여덟 개다. 기준 파일은 워크스페이스의 `Cathode1_260915.L5X`와 Desktop의 `VISION_CSM1.L5K`다. L5X, 로봇 프로그램, VISION PLC는 수정하지 않았고 다운로드하지 않았다. 온라인 Trend도 아직 기록하지 않았다.

2026-09-27 Rev.2는 수신 비트와 진단 Trend를 정리한 글이다. 그 절차는 아래 “Rev.2 진단 Trend”에 그대로 두었다. 전기동 감지의 상승과 휠 홈은 [인피드 전기동 감지의 상승, 수정 전 Trend 재검증](/notes/csm-r4-infeed-detect-rising-recheck/)에 있다. SC1 Robot3와 SM Finger Retry는 이 글의 대상이 아니다.

## 판단

등급이 사라지는 중심은 인피드 알람 자체가 아니다. 알람을 푸는 동안 R4를 조그로 움직여 전기동을 비전 다이에 올리면, 카메라 판정이 R1이 집기 전에 끝날 수 있다. CATHODE는 그 판정의 래치를 700 ms만 들고 있다가 끈다. R1이 그 창을 놓치면 11번 칸 `Weight`는 0으로 남고, SM#1 또는 SM#2에서 등급 없음이 켜진다.

이 렁은 `z_mode_automatic`과 `z_mode_manual`을 보지 않는다. `Robot1`은 50 ms 태스크에서 모드와 상관없이 실행된다. 그래서 오토 중에 로봇만 조그해도, 라인을 매뉴얼로 두고 조그해도 같은 시간 창이 적용된다. 매뉴얼에서도 등급이 사라지는 관찰은 이 구조와 맞다.

매번 사라지지 않는 이유는 판정 시각과 R1 집기 시각이 조그마다 달라지기 때문이다. 집기 창 안에 판정이 들어가면 등급은 남는다. 조그 중에 카메라가 전기동을 못 보고, 복귀 뒤 정상 사이클에서 처음 판정하면 역시 남을 수 있다.

휠이 인덱스 홈을 지나 전기동 감지가 두 번 오르는 것은 장부 번호가 비거나 다른 칸으로 옮겨지는 다른 경로다. 그 이동만으로 `Weight`가 0이 되지는 않는다. 한 번의 조그에서 번호 오류와 등급 없음이 같이 나올 수는 있다.

## 정상 자동에서 한 장이 가는 순서

칸 번호는 고정이다. 6번은 인피드 끝, 10번은 R4가 든 전기동, 11번은 비전 다이에 놓은 자리, 7번은 R1이 든 전기동, 9번은 SM#1, 12번은 SM#2다. 등급 숫자는 로봇이 들고 다니지 않는다. VISION이 짧은 신호를 보내고, CATHODE가 11번 칸에 적는다.

인피드가 전기동을 집는 자리까지 보낸다. 일련번호는 `Infeed_Conveyor.i_copper_not_at_robot`(`N1:0:I.0`)이 0이고 휠 홈이 1이며 컨베이어 출력이 0일 때 6번에 한 번 써진다. 이 비트의 1은 자리가 빈 상태다. 그때는 아직 등급이 없다.

R4가 전기동을 들어 자리가 비면, 반대 주소의 0에서 1이 한 스캔 동안 명령 20을 켠다. 장부는 다음 50 ms에 6번을 10번으로 복사한다. 휠 홈과 집기 성공은 보지 않는다.

<figure class="ld-rung" data-rung="13" data-rll="XIO(z_R4_Mode_Bypass)XIC(i_infeed_copper_at_unload)ONS(ons_R4_Pickup)OTL(z_Tracking_Commands[z_Track_Infeed_Robot4_Pickup]);">
<div class="rung-meta"><span class="rung-meta-number">Robot1 prod_tracking 원본 Rung 13</span><span class="rung-meta-description">R4 우회가 아니고 전기동 감지 비트가 0에서 1로 바뀌는 한 스캔에 명령 20을 켠다.</span></div>
</figure>

R4가 다이에 전기동을 놓으면 VISION의 `i_Die_Unload`가 CATHODE `R4_i_DIE_UNLOAD_to_R1`로 들어온다. 그 비트의 상승 한 스캔이 명령 21을 켜고, 10번을 11번으로 복사한다. 이 복사도 등급 숫자를 만들지 않는다. `i_Die_Unload`는 다이에 전기동이 있고, 비전 작업이 끝났거나 바이패스이며, R4 다이 안전과 다이 작업이 켜져 있고, 위치 오류가 없을 때 500 ms 뒤에 나간다.

<figure class="ld-rung" data-rung="14" data-rll="XIO(z_R4_Mode_Bypass)XIC(R4_i_DIE_UNLOAD_to_R1)ONS(ons_R4_Drop_Bar)OTL(z_Tracking_Commands[z_Track_Infeed_Robot4_Drop_Bar]);">
<div class="rung-meta"><span class="rung-meta-number">Robot1 prod_tracking 원본 Rung 14</span><span class="rung-meta-description">R4 우회가 아니고 다이 언로드 수신이 0에서 1로 바뀌는 한 스캔에 명령 21을 켠다.</span></div>
</figure>

카메라는 S, E, G, R 중 하나를 낸다. VISION `AUTO`에서 등급 코일은 자동 운전 비트를 보지 않는다. 해당 카메라 입력과 `i_Servo2_Ready_Status`가 켜지고 다른 등급 출력이 꺼져 있으면 `GRADE_*`가 켜진다. `ONS(Grade1)`가 `o_csm_Grade_*`를 걸고, `RESET_GR`의 PRE는 300이다. 완료되면 네 출력을 끈다. 네 등급이 `Grade1` 비트 하나를 같이 쓴다. 뒤에 있는 꺼진 등급 렁이 그 비트를 같은 스캔에 지우면, 카메라 입력이 켜져 있는 동안 출력이 다시 걸릴 수 있다. 그 동작은 이 파일만으로 컨트롤러에서 확인하지 않았으므로, 아래 Trend의 수신 비트가 짧은 펄스인지 유지되는지로 가른다.

CATHODE 수신은 `zc_Vision_Read[0]`이다. S는 `.16`, E는 `.17`, G는 `.18`, R은 `.4`다. `Robot1` `Background` 79렁부터 82렁은 수신이 1인 동안 자기 래치만 남긴다. 83렁이 네 래치 중 하나가 켜지면 `DELAY`를 센다. PRE는 700이다. 84렁이 끝나면 네 래치를 끈다. 수신이 아직 1이면 다음 스캔에 래치가 다시 켜지므로, 700 ms 해제는 수신이 이미 0일 때 유지된다.

<figure class="ld-rung" data-rung="79" data-rll="XIC(R4_i_Die_S_Grade_Signal)OTL(R4_S_Grade)OTU(R4_E_Grade)OTU(R4_G_Grade)OTU(R4_R_Grade);">
<div class="rung-meta"><span class="rung-meta-number">Robot1 Background 원본 Rung 79</span><span class="rung-meta-description">S 수신이 1인 동안 매 스캔 S 래치를 켜고 나머지 등급 래치를 끈다.</span></div>
</figure>

<figure class="ld-rung" data-rung="84" data-rll="XIC(DELAY.DN)OTU(R4_S_Grade)OTU(R4_E_Grade)OTU(R4_G_Grade)OTU(R4_R_Grade);">
<div class="rung-meta"><span class="rung-meta-number">Robot1 Background 원본 Rung 84</span><span class="rung-meta-description">700 ms가 끝나면 네 등급 래치를 끈다.</span></div>
</figure>

R1은 다이 작업 신호가 꺼져 있고 툴이 닫힌 순간부터 등급을 읽기 시작한다. 래치가 살아 있으면 그 스캔에 명령 22를 낸다. 꺼져 있으면 `TON_01`이 4000 ms를 세고, 시간이 끝나도 명령 22는 나간다. `Track_Infeed_Robot1_Pickup_Bar`가 래치를 보고 11번에 S=1, E=2, G=3, R=4를 적는다. R이면 `Rejected`도 1이다. 래치가 없으면 숫자를 적지 않고 11번을 7번으로 옮긴다. 11번 번호가 0이면 119를 채운 뒤 옮긴다. 119는 조업자가 넣는 번들 번호가 아니라, 번호가 없는 칸을 비어 있지 않게 만드는 고정 숫자다.

<figure class="ld-rung" data-rung="9" data-rll="[XIO(z_R4_Mode_Bypass)XIO(i_R1_DIE_WORKING)XIC(i_gripper_closed)ONS(ons_R1_Pickup_Bar)OTL(z_R1_Pickup_Bar),XIC(z_R1_Pickup_Bar)TON(TON_01,?,?),XIC(z_R1_Pickup_Bar)[XIC(TON_01.DN),XIC(R4_S_Grade),XIC(R4_E_Grade),XIC(R4_G_Grade),XIC(R4_R_Grade)]ONS(ons_R1_Pickup_Bar2)OTE(z_Get_R1_Pickup_Bar)OTU(z_R1_Pickup_Bar)];">
<div class="rung-meta"><span class="rung-meta-number">Robot1 prod_tracking 원본 Rung 9</span><span class="rung-meta-description">R4 우회가 아니고 다이 작업이 꺼져 있으며 툴이 닫히면 등급 래치 또는 4초 뒤에 집기 확정을 한 번 낸다.</span></div>
</figure>

SM#1은 7번을 9번으로 옮기기 전에 `Weight`가 0이면 `z_sm1_Grade_None`을 켠다. SM#2는 7번을 12번으로 옮기며 `z_sm2_Grade_None`을 켠다. HMI의 등급 없음은 이 비트다. 비전 화면의 판정이 남아 있어도, 옮기기 직전 장부가 0이면 표시는 켜진다.

## 인피드 에러 뒤 조그로 다이에 올릴 때

R4가 인피드에서 집다 알람이 나면 전기동은 툴에 반만 잡혀 있거나 아직 컨베이어 위에 있다. 조업자는 알람을 풀고 조그로 다시 집어 비전 다이에 올려 둔다. 이 시간은 0.7초보다 길다. 카메라와 VISION은 인피드 알람을 모른다. 전기동이 보이고 서보 준비가 되어 있으면 평소와 같이 등급 신호를 보낸다. CATHODE는 받자마자 700 ms를 센다. 사람이 R1을 집기 자세로 되돌리기 전에 래치가 꺼지면, 이후 R1은 4초를 기다려도 11번에 1~4를 적지 못한다.

툴이 닫혀 있고 다이 작업이 꺼진 상태가 판정보다 먼저 한 번 생기면 명령 22가 빈 11번을 먼저 옮긴다. 그 다음에 도착한 판정은 적을 칸이 이미 떠난 뒤다. 원본에는 그 판정을 따라가 다시 적을 곳이 없다.

`z_R4_Mode_Bypass`를 켜고 R1이 인피드에서 직접 집는 길은 비전 등급을 건너뛴다. 등급이 살아나는 조작이 아니다. 이 비트는 R4 바이패스, 다이 언로드가 꺼짐, R4 홈, R1 홈이 같이 있을 때 켜진다. 조그만으로 바이패스가 되지는 않는다. 간헐적인 소실과 구분하려면 Trend에서 이 비트가 0인지 본다.

## 오토와 매뉴얼이 같은 이유

라인 오토와 라인 매뉴얼은 `z_mode_automatic`, `z_mode_manual`이다. 등급 래치, 명령 20, 명령 21, 명령 22 어디에도 이 두 비트가 없다. 로봇 펜던트만 조그이고 PLC는 오토인 경우에도 이 렁은 그대로 돈다. 그래서 주로 오토 중에 수동 조그를 해도 등급이 빠지고, 매뉴얼로 바꿔 같은 올린 동작을 해도 빠질 수 있다.

VISION의 등급 코일에도 `Auto_Start`가 없다. `Auto_Start`는 `Auto_Ready`와 `i_csm_sys_running`이 같이 있을 때 켜지고, 다이 언로드로 가는 `z_Part_Ready`는 이 비트를 본다. 매뉴얼에서 설비 운전이 꺼져 있으면 명령 21에 필요한 언로드 신호는 안 나가고, 등급 펄스만 나갈 수 있다. 그 경우 10번이 11번으로 옮겨지지 않은 채 래치만 700 ms 뒤에 꺼진다.

## 간헐적으로 남는 경우

같은 조그라도 아래 중 하나면 등급이 남는다. R1이 이미 툴을 닫고 다이 작업을 끈 뒤 4초 대기를 세는 중에 판정이 들어온다. 조그 중 전기동이 카메라에서 빠졌다 다시 들어와 두 번째 판정이 그 대기 안에 들어온다. 조그 중에는 카메라가 전기동을 못 보고, 복귀 뒤 정상 자동에서 처음 판정이 R1 창과 겹친다.

반대로 다이에 올린 직후 수신 비트가 한 번 켜졌다가 꺼지고, 그 뒤로 700 ms가 지난 다음 R1의 다이 작업이 꺼지며 툴이 닫히면 그 건은 등급 없음으로 끝난다. 조업에서 말하는 간헐은 이 시각 차이로 설명한다. 컨트롤러 기록으로 아직 확정하지 않았다.

## 번호만 어긋나는 경로

등급을 0으로 만드는 렁은 아니다. 인피드 휠이 홈을 지난 뒤 전기동 감지가 여러 번 바뀌면, 홈이 0인 동안 `ui_i_c_num`은 오르지 않는다. 명령 20은 홈을 보지 않으므로 6번이 10번으로 옮겨지거나, 10번이 이미 차 있으면 명령만 지워질 수 있다. 아래 그림은 홈으로 들어간 뒤 350 ms를 쉬는 구간만 확대한 것이다. 그 사이 휠이 홈 도그를 지나면 홈 비트가 꺼질 수 있다.

<div class="sfc-snippet" data-transition-id="8" data-transition-y="160" data-next-y="240">
  <div class="sfc-step">State_Index2</div>
  <div class="sfc-transition"><b>Tran_006</b></div>
  <code>i_index_wheel_home</code>
  <div class="sfc-step">Delay</div>
</div>

777은 R4 집기 루틴 안에 있지만, 호출 쪽이 6번 번호가 0이 아닐 때만 루틴을 부르므로 지금 저장값에서는 써지지 않는다. 번들 번호는 `ui_i_b_num`이고 119, 777과 다르다.

## 경우

| 경우 | 등급 | 이 글에서 두는 위치 |
|---|---|---|
| 정상 자동이고 판정이 R1의 툴 닫힘, 다이 작업 꺼짐과 700 ms 안에서 겹친다 | 11번에 1~4가 적힌다 | 비교 기준이다 |
| 오토이든 매뉴얼이든, 조그로 올린 판정이 R1 집기보다 700 ms 이상 빠르다 | 0으로 남는다 | 이번 증상의 중심이다 |
| 집기 대기가 이미 열린 뒤 4초 안에 판정이 들어온다 | 1~4가 적힌다 | 간헐적으로 남는 쪽이다 |
| 조그 중 카메라는 못 보고 복귀 뒤 정상 사이클에서 처음 판정한다 | 남을 수 있다 | 간헐적으로 남는 다른 쪽이다 |
| 툴 닫힘과 다이 작업 꺼짐이 판정보다 먼저 명령 22를 낸다 | 0인 칸이 먼저 떠난다 | 늦은 판정은 따라 적지 못한다 |
| 홈이 0인데 전기동 감지가 0에서 1로 여러 번 바뀐다 | 래치와 무관하다 | 번호만 어긋날 수 있다 |
| `z_R4_Mode_Bypass`가 1이다 | 비전 경로를 타지 않는다 | 항상 없음이라 이번 간헐과 구분한다 |

셀 수 알람 76렁은 이 등급 경로가 아니다. 섹션 43~50의 12셀, 15셀 불일치는 그대로 둔다. 그 알람은 이 파일 안에서 집기나 등급 기록을 막지 않는다.

## 이번 판단을 보는 Trend

CATHODE에서 창을 둘 연다. 한 창의 펜은 여덟 개다. 샘플은 10 ms로 한다. 명령 20과 21은 약 한 주기만 켜지기 때문이다. 조그를 시작하기 전에 기록을 켜고, R1이 집은 뒤 `a_cathode[11].Weight`가 1~4로 남거나 0으로 끝나는 시점까지 본다. 평소처럼 인피드 에러 뒤 조그로 다이에 올리는 건만 기록한다. 오토 한 건과 매뉴얼 한 건을 따로 남긴다. 일부러 휠을 홈 밖으로 밀지 않는다.

창 1은 조그가 장부를 움직였는지 본다.

| 펜 | 태그 | 종류 | 보는 것 |
|---|---|---|---|
| 1 | `z_mode_automatic` | 디지털 | 라인 오토인지 본다 |
| 2 | `z_mode_manual` | 디지털 | 라인 매뉴얼인지 본다 |
| 3 | `Robot1.i_infeed_copper_at_unload` | 디지털 | 명령 20의 전기동 감지다 |
| 4 | `R4_i_DIE_UNLOAD_to_R1` | 디지털 | 다이에 놓았다는 수신이다 |
| 5 | `z_Tracking_Commands[20]` | 디지털 | 6번에서 10번으로 옮기는 명령이다 |
| 6 | `z_Tracking_Commands[21]` | 디지털 | 10번에서 11번으로 옮기는 명령이다 |
| 7 | `Infeed_Conveyor.i_index_wheel_home` | 디지털 | 번호 렁이 요구하는 휠 홈이다 |
| 8 | `Robot1.z_R4_Mode_Bypass` | 디지털 | 1이면 비전 등급 경로가 아니다 |

창 2는 판정 시각과 R1이 읽는 시각을 비교한다.

| 펜 | 태그 | 종류 | 보는 것 |
|---|---|---|---|
| 1 | `R4_i_Die_S_Grade_Signal` | 디지털 | S 수신이다 |
| 2 | `R4_i_Die_E_Grade_Signal` | 디지털 | E 수신이다 |
| 3 | `R4_i_Die_G_Grade_Signal` | 디지털 | G 수신이다 |
| 4 | `R4_i_Die_R_Grade_Signal` | 디지털 | R 수신이다 |
| 5 | `Robot1.i_R1_DIE_WORKING` | 디지털 | 꺼질 때 집기 판정이 시작된다 |
| 6 | `Robot1.i_gripper_closed` | 디지털 | 툴이 닫혀 있어야 집기 판정이 시작된다 |
| 7 | `Robot1.z_Get_R1_Pickup_Bar` | 디지털 | 등급 또는 4초로 집기가 확정된다 |
| 8 | `Cathode_Tracking.a_cathode[11].Weight` | 아날로그 | 0이면 등급이 안 적힌 것이다 |

창 2의 1번부터 4번 중 하나가 조그로 올린 직후 켜졌다가 꺼지고, 그 뒤 5번이 꺼지면서 6번이 켜지며, 7번 뒤에 8번이 0이면 이번 판단과 맞다. 7번보다 먼저 8번이 1~4이거나, 수신이 7번 이후에야 처음 켜지면 그 건은 조그 선행 판정이 아니다. 4초 대기를 보려면 새 창을 만들지 말고 8번만 `Robot1.zTimeOverGrade`로 바꿔 다시 기록한다. VISION 카메라 입력은 다른 PLC라 이 두 창에 넣지 않는다. 수신이 조그 때 켜지지 않은 건만 나중에 VISION 쪽에서 본다.

## Rev.2 진단 Trend

아래는 2026-09-27에 정리한 진단 절차다. 등급 없음이 어느 구간에서 생겼는지 양쪽 PLC로 좁힐 때 쓴다. Rev.3의 두 창은 조그로 다이에 올리는 건을 CATHODE에서 확인하는 절차이고, 아래 여섯 창을 동시에 열라는 뜻이 아니다.

## 증상과 확인 기준

HMI에서 `z_sm1_Grade_None` 또는 `z_sm2_Grade_None`이 켜지면 “등급 없음”이 표시된다. CATHODE 1의 Drop Tracking은 SM으로 넘기기 직전 `a_cathode[7].Weight=0`을 확인하면 해당 Grade None 태그를 켠다.

따라서 이 표시는 SM에서 등급이 새로 사라졌다는 뜻으로 단정할 수 없다. VISION이 등급을 만들지 못했는지, CATHODE 1이 수신·보존하지 못했는지, R1 Pickup Tracking이 시간 초과로 진행했는지, `[11] → [7]` 이동 전에 grade flag가 없어졌는지를 순서대로 확인해야 한다.

이 문서는 로그를 확보하기 위한 진단 절차다. 타이머를 바로 바꾸지 않는다. 같은 실패 건의 Trend가 확보된 뒤 원인이 확인된 타이머 하나만 단독 시험한다.

## 먼저 구분할 것: 같은 이름과 데이터 방향

`zp_Vision_Write[0]`라는 이름만으로 데이터 방향을 판단하면 안 된다. 양쪽 PLC에 비슷한 이름의 Produced/Consumed 태그가 있기 때문이다. 이번 등급 수신 경로는 다음과 같다.

```text
VISION PLC  zp_Vision_Write[0]  Produced DINT[5]
        ── RPI 20 ms ──>
CATHODE 1  zc_Vision_Read[0]   Consumed DINT[5]
```

CATHODE 1에 있는 `zp_Vision_Write[0]`는 반대 방향의 제어·상태용 Produced word다. R1/Vision Allow 같은 상태가 섞여 있으므로, VISION의 등급 수신값으로 읽으면 안 된다.

## `zp_Vision_Write[0]`은 합계값이 아니라 bit별로 읽는다

VISION PLC의 `zp_Vision_Write`는 `DINT[5]`다. `[0]`은 32 bit 정수 하나이며, 등급은 총합값이나 byte 단위가 아니라 개별 bit에 표시된다.

| 등급 | VISION 입력 | VISION 출력 | CATHODE 수신 |
|---|---|---|---|
| S | `Local:4:I.Data.2` | `o_csm_Grade_S` | `R4_i_Die_S_Grade_Signal` |
| E | `Local:4:I.Data.3` | `o_csm_Grade_E` | `R4_i_Die_E_Grade_Signal` |
| G | `Local:4:I.Data.1` | `o_csm_Grade_G` | `R4_i_Die_G_Grade_Signal` |
| R | `Local:4:I.Data.15` | `o_csm_Grade_R` | `R4_i_Die_R_Grade_Signal` |

송신 비트는 S가 `.16`, E가 `.17`, G가 `.18`, R이 `.4`다. mask는 순서대로 65536, 131072, 262144, 16이다.

원시 DINT 값에는 등급 외의 상태 bit도 동시에 들어갈 수 있다. 따라서 예를 들어 원시값이 16이라고 해서 항상 R급으로 비교하거나, 여러 bit가 더해진 값을 등급 번호로 읽으면 안 된다.

- 권장 방법은 네 개의 BOOL alias를 각각 Trend하는 것이다.
- 원시값도 함께 볼 때는 `raw AND mask != 0`으로 bit를 확인한다. R급은 `raw AND 16 != 0`일 때만 1이다.
- Studio에서는 해당 word를 Binary radix로 표시하면 `.0`부터 `.31`까지의 상태를 확인할 수 있다.

## 등급 번호는 두 체계가 있다

VISION 내부 `CHECK` 값과 CATHODE Tracking의 `a_cathode[].Weight` 값은 같은 번호가 아니다. SM까지 따라가야 하는 값은 `Weight`다.

| 등급 | VISION `CHECK` 값 | CATHODE Tracking `Weight` 값 |
|---|---:|---:|
| S | 2 | 1 |
| E | 4 | 2 |
| G | 3 | 3 |
| R | 1 | 4 |

`Track_Infeed_Robot1_Pickup_Bar`는 `a_cathode[11].Weight`에 S=1, E=2, G=3, R=4를 기록한다. R급은 `a_cathode[11].Rejected=1`도 기록한다. 이어서 `Move_Cathode`가 `[11] → [7]`로 값을 이동시킨다.

## R4 · VISION DIE · R1 · SM 데이터 흐름도

<div class="grade-flow">
  <div class="grade-flow-track">
    <div class="grade-flow-step"><b>R1 + R4 I/O</b><span>DIE working, grip, safety, loaded pulse</span><small>R4 safety와 R1 상태가 VISION 조건에 들어간다.</small></div>
    <div class="grade-flow-step signal"><b>VISION DIE</b><span>Camera grade DI를 판정하고 S/E/G/R bit를 latch한다.</span><small><code>RESET_GR</code>가 300 ms 동안 출력을 유지한다.</small></div>
    <div class="grade-flow-step timer"><b>CATHODE 1 수신</b><span><code>zc_Vision_Read[0]</code>에서 grade bit를 받아 <code>R4_*_Grade</code>로 보존한다.</span><small><code>DELAY</code>는 700 ms다.</small></div>
    <div class="grade-flow-step timer"><b>R1 Tracking</b><span><code>a_cathode[11]</code>에 Weight를 쓰고 <code>[7]</code>로 옮긴다.</span><small><code>TON_01</code>은 4,000 ms다.</small></div>
    <div class="grade-flow-step fault"><b>SM Drop</b><span>SM#1은 <code>[7] → [9]</code>, SM#2는 <code>[7] → [12]</code>로 이동한다.</span><small><code>Weight=0</code>이면 Grade None을 표시한다.</small></div>
  </div>
</div>

### 타이머가 적용되는 조건

1. `tm_Part_On`은 Part On과 Tracking Sensor 조건을 200 ms 확인한다.
2. `z_Part_Ready`는 Auto Start, Part/Tracking, `tm_Part_On.DN`, `i_SAFETY_DIE_from_R1`, `i_R1_Grippd`, Vision bypass 조건을 함께 사용한다.
3. VISION DIE unload는 `Vision_Work_Done` 또는 bypass, `i_r4_DIE_Safety`, `i_r4_Die_Working`, part position 정상 조건 뒤 `delay_ton01` 500 ms가 끝나야 `i_Die_Unload`를 켠다.
4. 카메라 grade DI와 `i_Servo2_Ready_Status`가 충족되면 `o_csm_Grade_*`를 latch한다. `RESET_GR` 300 ms가 끝나면 네 grade output을 해제한다.
5. CATHODE 1 `Robot1 / Background`는 수신 bit를 `R4_*_Grade`로 유지하고, `DELAY` 700 ms가 끝나면 해제한다.
6. CATHODE 1 `Robot1 / prod_tracking`은 R1 Pickup 사건 뒤 `TON_01` 4,000 ms 안에 grade가 생기거나 timeout이 되면 Pickup Tracking command[22]를 만든다.

따라서 한 실패 건에서는 VISION 300 ms, CATHODE 1 700 ms, R1 Pickup 4,000 ms의 선후관계를 반드시 같이 본다.

### FANUC R1에서 확인할 물리 handshake

| R1 프로그램 | 명령 | 확인할 의미 |
|---|---|---|
| `RSR0001.PE` line 9, `BUNLD_NE.PE` line 30 | `DO[19:DIE_ROBOT_WORKING]` ON | R1이 DIE 작업 구간에 있다. |
| `BLOAD_1.PE` line 13, `BLOAD_2.PE` line 6 | `DO[18:VISION_OK_ON]` ON | VISION 허가/상태 handshake다. |
| `BLOAD_1.PE` line 29 | `DO[2:Loaded 1 Pulse]` 1.0 s | SM#1 loaded 물리 pulse다. |
| `BLOAD_2.PE` line 22 | `DO[3:Loaded 2 Pulse]` 1.0 s | SM#2 loaded 물리 pulse다. |

FANUC R1에서 S/E/G/R 숫자를 직접 보관·이동하는 명령은 확인하지 못했다. 등급 숫자가 처음 기록되는 곳은 CATHODE 1 `a_cathode[11].Weight`다. 현장에서는 DO[2]/DO[3]과 `i_sm1_loaded`/`i_sm2_loaded`의 실제 I/O 결선을 Online 상태로 한 번 대조한다.

## Trend 설정: VISION PLC

V1~V3을 동시에 설정한다. 각 Trend는 정확히 8태그이며, `Digital`은 BOOL/bit, `Analog`는 DINT 또는 TIMER `.ACC`다.

### V1. VISION 진입·DIE 허가 조건

| # | 태그 | 구분 | 확인 목적 |
|---:|---|---|---|
| 1 | `i_Part_on` | Digital | VISION part가 있는지 확인한다. |
| 2 | `i_Part_Tracking_Sensor_1` | Digital | Tracking sensor 1을 확인한다. |
| 3 | `tm_Part_On.DN` | Digital | 200 ms Part 안정 완료를 확인한다. |
| 4 | `i_R1_Grippd` | Digital | R1 grip 상태를 확인한다. |
| 5 | `i_SAFETY_DIE_from_R1` | Digital | R1→DIE safety를 확인한다. |
| 6 | `i_r4_DIE_Safety` | Digital | R4 DIE safety 입력을 확인한다. |
| 7 | `i_r4_Die_Working` | Digital | R4 DIE working 입력을 확인한다. |
| 8 | `i_Die_Unload` | Digital | 500 ms 뒤 DIE unload가 켜지는지 확인한다. |

### V2. VISION 판정부터 grade 송신까지

| # | 태그 | 구분 | 확인 목적 |
|---:|---|---|---|
| 1 | `Local:4:I.Data.2` | Digital | S grade 원입력을 확인한다. |
| 2 | `Local:4:I.Data.3` | Digital | E grade 원입력을 확인한다. |
| 3 | `Local:4:I.Data.1` | Digital | G grade 원입력을 확인한다. |
| 4 | `Local:4:I.Data.15` | Digital | R grade 원입력을 확인한다. |
| 5 | `o_csm_Grade_S` | Digital | Produced `[0].16` output을 확인한다. |
| 6 | `o_csm_Grade_E` | Digital | Produced `[0].17` output을 확인한다. |
| 7 | `o_csm_Grade_G` | Digital | Produced `[0].18` output을 확인한다. |
| 8 | `o_csm_Grade_R` | Digital | Produced `[0].4` output을 확인한다. |

### V3. VISION 시간 창·원시 word

| # | 태그 | 구분 | 확인 목적 |
|---:|---|---|---|
| 1 | `RESET_GR.ACC` | Analog | Grade output 유지시간 300 ms를 확인한다. |
| 2 | `RESET_GR.DN` | Digital | 300 ms 종료 시점을 확인한다. |
| 3 | `delay_ton01.ACC` | Analog | DIE unload 지연 500 ms를 확인한다. |
| 4 | `delay_ton01.DN` | Digital | DIE unload 지연 완료를 확인한다. |
| 5 | `tm_Part_On.ACC` | Analog | Part 안정 시간 200 ms를 확인한다. |
| 6 | `tm_Part_On.DN` | Digital | Part 안정 완료를 확인한다. |
| 7 | `zp_Vision_Write[0]` | Analog | 원시 DINT 참고용으로만 저장한다. |
| 8 | `i_Servo2_Ready_Status` | Digital | Grade 판정 공통 허가를 확인한다. |

## Trend 설정: CATHODE 1 PLC

C1~C3을 동시에 설정한다. 각 Trend는 정확히 8태그다.

### C1. VISION 수신과 CATHODE grade 보존

| # | 태그 | 구분 | 확인 목적 |
|---:|---|---|---|
| 1 | `R4_i_Die_S_Grade_Signal` | Digital | `zc_Vision_Read[0].16` 수신을 확인한다. |
| 2 | `R4_i_Die_E_Grade_Signal` | Digital | `zc_Vision_Read[0].17` 수신을 확인한다. |
| 3 | `R4_i_Die_G_Grade_Signal` | Digital | `zc_Vision_Read[0].18` 수신을 확인한다. |
| 4 | `R4_i_Die_R_Grade_Signal` | Digital | `zc_Vision_Read[0].4` 수신을 확인한다. |
| 5 | `R4_S_Grade` | Digital | Robot1 Background가 보존한 S grade를 확인한다. |
| 6 | `R4_E_Grade` | Digital | Robot1 Background가 보존한 E grade를 확인한다. |
| 7 | `R4_G_Grade` | Digital | Robot1 Background가 보존한 G grade를 확인한다. |
| 8 | `R4_R_Grade` | Digital | Robot1 Background가 보존한 R grade를 확인한다. |

### C2. R1 Pickup 시간 창

| # | 태그 | 구분 | 확인 목적 |
|---:|---|---|---|
| 1 | `DELAY.ACC` | Analog | CATHODE grade hold 시간 700 ms를 확인한다. |
| 2 | `DELAY.DN` | Digital | 700 ms 종료와 grade 해제 시점을 확인한다. |
| 3 | `TON_01.ACC` | Analog | R1 Pickup 후 대기시간 4,000 ms를 확인한다. |
| 4 | `TON_01.DN` | Digital | R1 Pickup timeout을 확인한다. |
| 5 | `z_R1_Pickup_Bar` | Digital | R1 Pickup tracking 대기 시작을 확인한다. |
| 6 | `z_Get_R1_Pickup_Bar` | Digital | grade 또는 timeout으로 pickup이 확정되는지 확인한다. |
| 7 | `zTimeOverGrade` | Digital | pickup 대기 timeout 경로를 확인한다. |
| 8 | `z_Tracking_Commands[22]` | Digital | Pickup Tracking command를 확인한다. |

### C3. SM#1·SM#2 분기와 Grade None

| # | 태그 | 구분 | 확인 목적 |
|---:|---|---|---|
| 1 | `a_cathode[7].Weight` | Analog | SM Drop 직전 등급이 S1/E2/G3/R4인지, 0인지 확인한다. |
| 2 | `z_signal_r1_sm1_loaded` | Digital | SM#1 loaded 사건을 확인한다. |
| 3 | `z_Tracking_Commands[4]` | Digital | SM#1 Drop command를 확인한다. |
| 4 | `z_sm1_Grade_None` | Digital | SM#1에서 Weight=0을 감지했는지 확인한다. |
| 5 | `z_signal_r1_sm2_loaded` | Digital | SM#2 loaded 사건을 확인한다. |
| 6 | `z_Tracking_Commands[5]` | Digital | SM#2 Drop command를 확인한다. |
| 7 | `z_sm2_Grade_None` | Digital | SM#2에서 Weight=0을 감지했는지 확인한다. |
| 8 | `z_R1_Pickup_done` | Digital | `[11] → [7]` 이동 완료를 확인한다. |

## Trend 판독 순서

1. HMI에 표시된 장비 번호와 발생 시각을 기록한다. V1~V3과 C1~C3에서 같은 시간대를 확인한다.
2. V2에서 원입력과 대응 `o_csm_Grade_*`가 모두 없으면 카메라 판정, Servo Ready, Part 조건을 V1과 V3에서 확인한다.
3. V2 output이 있는데 C1의 대응 `R4_i_Die_*_Grade_Signal`이 없으면 Produced/Consumed 통신과 20 ms RPI 구간을 우선 확인한다.
4. C1 수신은 있었지만 `R4_*_Grade`가 `z_Get_R1_Pickup_Bar` 전에 꺼지면 VISION 300 ms, CATHODE 1 700 ms, 실제 R1 Pickup의 시간 순서가 맞지 않은 것이다.
5. `z_Get_R1_Pickup_Bar`와 command[22]가 있는데 C3의 `a_cathode[7].Weight`가 0이면, Pickup Tracking이 grade flag 없이 `[11] → [7]` 이동을 실행했는지 확인한다.
6. `[7].Weight`가 1~4인데 Grade None이 뜨면 SM Drop command와 HMI 표시 유지 조건을 추가로 확인한다. 이 경우 VISION 판정 문제로 바로 결론 내리면 안 된다.

## 원본 프로그램 위치

| 구간 | Program / Routine | 확인할 로직 |
|---|---|---|
| VISION grade 생성 | VISION PLC `AUTO` Routine | `Local:4:I.Data.2/.3/.1/.15`와 Servo Ready가 `GRADE_*`, `o_csm_Grade_*`, `RESET_GR`로 이어진다. |
| VISION DIE unload | VISION PLC `AUTO` Routine | `Vision_Work_Done`, R4 safety/working, `delay_ton01` 500 ms가 `i_Die_Unload`로 이어진다. |
| CATHODE 수신·보존 | CATHODE 1 `Robot1 / Background`, Rung 79~84 | `R4_i_Die_*_Grade_Signal`이 `R4_*_Grade`가 되고 `DELAY` 700 ms 후 해제된다. |
| R1 Pickup 판정 | CATHODE 1 `Robot1 / prod_tracking`, Rung 9~12 | `z_R1_Pickup_Bar`, `TON_01`, `z_Get_R1_Pickup_Bar`, command[22]를 확인한다. |
| Weight 기록 | CATHODE 1 `Cathode_Tracking / Track_Infeed_Robot1_Pickup_Bar` | `[11]`에 Weight를 기록하고 `Move_Cathode(11→7)`를 실행한다. |
| SM#1 Grade None | CATHODE 1 `Cathode_Tracking / Track_Infeed_Robot_Drop_S1` | `[7].Weight=0`이면 `z_sm1_Grade_None`을 켜고 `[7]→[9]`로 이동한다. |
| SM#2 Grade None | CATHODE 1 `Cathode_Tracking / Track_Infeed_Robot_Drop_S2` | `[7].Weight=0`이면 `z_sm2_Grade_None`을 켜고 `[7]→[12]`로 이동한다. |

## 로그를 전달할 때 함께 필요한 정보

1. 각 Trend 파일의 시작·종료 시각과 저장 주기다.
2. HMI에 Grade None이 표시된 SM 번호와 시각이다.
3. 당시 `RESET_GR.PRE`, `DELAY.PRE`, `TON_01.PRE` 값이다.
4. 가능하면 해당 제품의 생산 순번과 VISION 화면의 판정 결과다.
5. Trend 화면 캡처와 내보낸 CSV 또는 원본 파일이다.

로그를 받으면 VISION 판정 지연, Produced/Consumed 수신 문제, CATHODE grade hold 만료, R1 Pickup timeout, Tracking 이동 문제, HMI 표시 유지 문제를 시간 순서로 구분한다.
