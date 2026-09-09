---
title: SC1 Robot#3 새 번들의 첫 장 리젝트를 G급과 R급으로 바꾸는 작업안
date: "2026-09-09"
excerpt: A8 Reject 번들이 배출된 뒤 첫 E급을 리젝트하던 조건을 빼고, 첫 G급과 R급만 리젝트하도록 Robot3 Reject Rung 14의 등급 비교를 바꾼다.
kicker: PLC
tags: ["PLC", "SC1", "Robot3", "A8"]
---

SC1 Robot#3는 A8 Reject에 전기동을 한 장씩 내려놓는다. Robot에서 설정한 한계 매수를 넘으면 `REJ_FULL`을 실행하고 A8에 번들 배출 신호를 보낸다. PLC가 적재 매수를 전송하고 `ToTal_Reject` 카운터를 0으로 초기화하면 새 번들의 첫 장 조건이 다시 켜진다.

현재 첫 장 조건은 E급과 G급을 리젝트한다. 이번 작업안은 E급을 빼고 G급과 R급을 넣는다.

| 등급 | 현재 첫 장 처리 | 수정 후 첫 장 처리 |
|---|---|---|
| S급 | 첫 장 조건으로 리젝트하지 않는다. | 기존과 같다. |
| E급 | 첫 장이면 리젝트한다. | 첫 장 조건으로는 리젝트하지 않는다. |
| G급 | 첫 장이면 리젝트한다. | 기존과 같다. |
| R급 | 별도 R급 판정에 따라 리젝트한다. | 첫 장 조건에도 포함한다. |

## 바꾸는 위치

Studio 5000에서 다음 경로를 연다.

```text
Program: Robot3
Routine: Reject
Rung: 14
```

이 Rung에는 Tracking Reject, Vision R급, 첫 장 등급 조건과 `Reject_Start_Cmd` 자기유지가 병렬로 들어 있다. 그중에서 `ToTal_Reject.ACC=0` 뒤에 있는 등급 비교 숫자만 바꾼다.

## 원본

```text
[XIC(Reject_Counter_1[0].0),XIC(Reject_Counter_2[0].0),XIC(z_reject_enable_at_bar)XIC(z_Sheet1_CV_Last_Reject),XIC(z_reject_enable_at_last_sc1)XIC(z_Vision_reject_R3),EQU(ToTal_Reject.ACC,0)[EQU(z_sc1_R3_Grade,2),EQU(z_sc1_R3_Grade,3)],XIC(Reject_Start_Cmd)]XIO(i_Reject_End)OTE(Reject_Start_Cmd);
```

현재 등급 번호는 다음과 같다.

| 값 | 등급 |
|---:|---|
| 1 | S급이다. |
| 2 | E급이다. |
| 3 | G급이다. |
| 4 | R급이다. |

원본은 카운터가 0일 때 등급 2 또는 3을 검사하므로 E급과 G급을 첫 장으로 리젝트한다.

## 수정본

```text
[XIC(Reject_Counter_1[0].0),XIC(Reject_Counter_2[0].0),XIC(z_reject_enable_at_bar)XIC(z_Sheet1_CV_Last_Reject),XIC(z_reject_enable_at_last_sc1)XIC(z_Vision_reject_R3),EQU(ToTal_Reject.ACC,0)[EQU(z_sc1_R3_Grade,3),EQU(z_sc1_R3_Grade,4)],XIC(Reject_Start_Cmd)]XIO(i_Reject_End)OTE(Reject_Start_Cmd);
```

달라지는 부분은 한곳이다.

```diff
- EQU(ToTal_Reject.ACC,0)[EQU(z_sc1_R3_Grade,2),EQU(z_sc1_R3_Grade,3)]
+ EQU(ToTal_Reject.ACC,0)[EQU(z_sc1_R3_Grade,3),EQU(z_sc1_R3_Grade,4)]
```

## E급이 다른 조건으로 리젝트되는 경우

수정 후에도 E급이 무조건 통과하는 것은 아니다. 다음 신호 중 하나가 켜지면 기존 Reject 경로가 그대로 동작한다.

- `Reject_Counter_1[0].0`에 Reject 정보가 들어온다.
- `Reject_Counter_2[0].0`에 Reject 정보가 들어온다.
- `z_Sheet1_CV_Last_Reject`에 Tracking Reject가 들어온다.
- `z_Vision_reject_R3`에 Vision R급 신호가 들어온다.
- `Reject_Start_Cmd`가 이미 켜져서 자기유지 중이다.

첫 E급 통과 시험에서는 `z_sc1_R3_Grade=2`만 볼 것이 아니라 이 병렬 신호도 함께 확인해야 한다.

## A8 번들 배출에는 무엇이 바뀌는가

번들 배출 조건은 바뀌지 않는다. Robot#3는 전기동을 내려놓을 때 `R[35:Next posn Reject]`를 1씩 올린다. 이 값이 `R[34:Limit Count]`보다 커지면 `REJ_FULL`을 호출한다.

```text
IF R[35:Next posn Reject]>R[34:Limit Count],CALL REJ_FULL
```

`REJ_FULL`은 `DO[101:REJECT FULL]`을 1초 동안 켜고 다음 적재 위치를 1로 초기화한다. PLC는 이 신호를 `i_Reject_Full`로 받아 A8 완료 신호를 보내고, 적재 매수를 전송한 다음 `ToTal_Reject`를 초기화한다.

따라서 이번 변경은 21매 또는 현장에서 지정한 매수, Robot의 `R[34:Limit Count]`, A8 Export와 데이터 전송을 건드리지 않는다. 카운터가 0인 첫 장에서 어떤 등급을 리젝트할지만 바꾼다.

## 같이 바꾸면 안 되는 조건

- Rung 14의 Tracking Reject 조건을 삭제하지 않는다.
- Rung 14의 Vision R급 조건을 삭제하지 않는다.
- `Reject_Start_Cmd` 자기유지와 `i_Reject_End` 완료 조건을 바꾸지 않는다.
- `z_R3_Reject_First_Grade` 기록을 바꾸지 않는다.
- A8 완료 신호, 적재 매수 전송과 카운터 초기화 Rung을 바꾸지 않는다.
- Robot LS와 `R[34:Limit Count]`를 이번 작업과 함께 바꾸지 않는다.

## Online에서 확인할 태그

Studio 5000 Trend에는 다음 태그를 넣는다.

```text
ToTal_Reject.ACC
z_sc1_R3_Grade
z_Sheet1_CV_Last_Reject
z_Vision_reject_R3
Reject_Counter_1[0].0
Reject_Counter_2[0].0
Reject_Start_Cmd
permit_Reject_start
o_Reject_Enable
o_unload_infeed
i_Reject_End
i_Reject_Full
csm1_o_Robot_Completed_to_A8
csm1_o_Robot_Data_Set_to_A8
csm1_Robot_R_CurrentCathodes
csm1_Robot_R_NumCathodes
z_R3_Reject_First_Grade
```

## 시험 순서

1. Online Controller의 `Robot3 → Reject → Rung 14`가 원본과 같은지 확인한다.
2. Rung 14에서 첫 장 등급 비교를 2와 3에서 3과 4로 바꾼다.
3. Studio 5000에서 수정 Rung을 Verify하고 오류가 없는지 확인한다.
4. A8 번들을 배출한 뒤 `ToTal_Reject.ACC=0`을 확인한다.
5. 다른 Reject 병렬 신호가 모두 꺼진 상태에서 첫 E급이 정상 통과하는지 확인한다.
6. 새 번들의 첫 G급과 첫 R급이 Robot#3 Reject로 가는지 각각 확인한다.
7. `i_Reject_End`가 한 번 들어올 때 카운터도 한 번만 증가하는지 확인한다.
8. 현장 지정 매수에 도달하면 `REJ_FULL`, A8 Export, 적재 매수 전송과 카운터 초기화가 기존 순서대로 동작하는지 확인한다.

첫 E급이 정상 통과하고, 첫 G급과 R급이 리젝트되며, A8 Export와 적재 매수가 이전과 같을 때 작업을 완료한 것으로 판단한다.
