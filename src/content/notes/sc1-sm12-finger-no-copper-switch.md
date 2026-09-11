---
title: SC1 Finger 센서를 HMI 버튼으로 60초만 우회하는 작업안
date: "2026-09-11"
excerpt: InTouch 버튼을 한 번 누르면 PLC가 SM#1 또는 SM#2의 Finger 센서를 60초만 우회하고 자동으로 실제 센서 사용으로 돌아가게 하는 작업안이다.
kicker: PLC
tags: ["PLC", "InTouch", "SC1", "SM1", "SM2"]
---

기존의 유지형 ON/OFF 선택 대신 장비별 `60초 우회 시작` 버튼을 사용한다. HMI는 요청만 보내고, 우회 시간과 자동 복귀는 PLC가 책임진다.

```text
HMI 버튼을 한 번 누른다.
→ PLC가 요청을 한 번만 받는다.
→ 해당 SM의 우회 상태가 켜진다.
→ PLC TON이 60초를 계산한다.
→ 60초가 지나면 우회 상태가 자동으로 꺼진다.
→ 실제 Finger No Copper 센서를 다시 사용한다.
```

이 방식이면 HMI 화면을 닫거나 통신이 끊겨도 PLC 타이머가 계속 동작한다. 우회 중 컨트롤러가 Run 모드로 다시 들어오면 첫 스캔에 우회를 해제한다.

## 원본에서 확인한 입력과 판정

| 장비 | 프로그램 태그 | 실제 입력 |
|---|---|---|
| SM#1 | `i_finger_1_no_copper` | `N4:1:I.5`이다. |
| SM#1 | `i_finger_2_no_copper` | `N4:1:I.6`이다. |
| SM#2 | `i_finger_1_no_copper` | `N6:1:I.5`이다. |
| SM#2 | `i_finger_2_no_copper` | `N6:1:I.6`이다. |

원본 완료 판정은 두 장비 모두 다음 형태이다.

```text
XIC(i_finger_1_down)XIO(i_finger_1_no_copper)OTE(f_finger1_separated);
XIC(i_finger_2_down)XIO(i_finger_2_no_copper)OTE(f_finger2_separated);
```

PLC 입력이 0이면 `XIO`가 참이다. 적용 전에 Online에서 센서 연결과 감지 상태별 실제 극성을 다시 확인해야 한다.

## PLC에 추가할 태그

| 태그 | 형식 | 초기값 | 용도 |
|---|---|---:|---|
| `ui_sm1_finger_bypass_req` | BOOL | 0 | InTouch가 SM#1 우회를 요청한다. |
| `ui_sm2_finger_bypass_req` | BOOL | 0 | InTouch가 SM#2 우회를 요청한다. |
| `ui_sm1_finger_bypass_cancel` | BOOL | 0 | SM#1을 즉시 센서 사용으로 돌린다. |
| `ui_sm2_finger_bypass_cancel` | BOOL | 0 | SM#2를 즉시 센서 사용으로 돌린다. |
| `z_sm1_finger_bypass_active` | BOOL | 0 | PLC가 관리하는 SM#1 우회 상태이다. |
| `z_sm2_finger_bypass_active` | BOOL | 0 | PLC가 관리하는 SM#2 우회 상태이다. |
| `ons_sm1_finger_bypass_req` | BOOL | 0 | SM#1 요청을 한 번만 받는 ONS 저장 비트이다. |
| `ons_sm2_finger_bypass_req` | BOOL | 0 | SM#2 요청을 한 번만 받는 ONS 저장 비트이다. |
| `tm_sm1_finger_bypass` | TIMER | PRE 60000 | SM#1의 60초 TON이다. |
| `tm_sm2_finger_bypass` | TIMER | PRE 60000 | SM#2의 60초 TON이다. |

Logix TON은 1 ms 단위를 사용하므로 PRE 60000은 60초이다. [Rockwell Automation TON 설명](https://www.rockwellautomation.com/en-gb/docs/studio-5000-logix-designer/38-00/contents-ditamap/instruction-set/timer-and-counter-instructions/timer-on-delay--ton-.html)

기존 `ui_sm1_finger_no_copper`, `ui_sm2_finger_no_copper` 유지형 선택은 사용하지 않는다. 작업자가 우회를 계속 켜 둔 채 잊는 상황을 막기 위해서다.

## PLC 시간 제한 로직

SM#1 `BasicControl`에는 다음 순서로 Rung을 넣는다.

```text
XIC(S:FS)OTU(z_sm1_finger_bypass_active);
XIC(ui_sm1_finger_bypass_req)ONS(ons_sm1_finger_bypass_req)OTL(z_sm1_finger_bypass_active);
XIC(z_sm1_finger_bypass_active)TON(tm_sm1_finger_bypass,?,?);
[XIC(tm_sm1_finger_bypass.DN),XIC(ui_sm1_finger_bypass_cancel)]OTU(z_sm1_finger_bypass_active);
```

SM#2도 독립 태그로 같은 Rung을 넣는다.

```text
XIC(S:FS)OTU(z_sm2_finger_bypass_active);
XIC(ui_sm2_finger_bypass_req)ONS(ons_sm2_finger_bypass_req)OTL(z_sm2_finger_bypass_active);
XIC(z_sm2_finger_bypass_active)TON(tm_sm2_finger_bypass,?,?);
[XIC(tm_sm2_finger_bypass.DN),XIC(ui_sm2_finger_bypass_cancel)]OTU(z_sm2_finger_bypass_active);
```

`S:FS`는 프로그램이 Run 모드에서 처음 스캔될 때 켜지는 상태 플래그이다. [Rockwell Automation S:FS 설명](https://www.rockwellautomation.com/ko-kr/docs/studio-5000-logix-designer/38-00/contents-ditamap/instruction-set/math-status-flags.html)

## 완료 판정에 우회를 연결하는 방법

SM#1은 다음처럼 바꾼다.

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm1_finger_bypass_active)]OTE(f_finger1_separated);
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(z_sm1_finger_bypass_active)]OTE(f_finger2_separated);
```

SM#2는 다음처럼 바꾼다.

```text
XIC(i_finger_1_down)[XIO(i_finger_1_no_copper),XIC(z_sm2_finger_bypass_active)]OTE(f_finger1_separated);
XIC(i_finger_2_down)[XIO(i_finger_2_no_copper),XIC(z_sm2_finger_bypass_active)]OTE(f_finger2_separated);
```

우회가 켜져 있어도 Finger Down이 들어오지 않으면 완료 비트는 켜지지 않는다. 실제 센서 입력도 덮어쓰거나 Force하지 않는다.

## InTouch 화면 구성

장비마다 다음 요소를 둔다.

- `Finger 센서 60초 우회` Momentary 버튼을 둔다.
- 누르는 동안 요청 비트를 1로 만들고, 손을 떼면 0으로 돌린다.
- `z_*_finger_bypass_active`를 읽는 주황색 상태 램프를 둔다.
- `tm_*_finger_bypass.ACC`를 이용해 남은 시간을 표시한다.
- `즉시 센서 복귀` Momentary 버튼으로 Cancel 비트를 보낸다.
- 실제 입력 5번과 6번은 별도 램프로 보여 준다.

```text
Touch Down: SM1_FingerBypassReq = 1;
Touch Up:   SM1_FingerBypassReq = 0;
```

SM#2도 같은 방식으로 만든다. InTouch 버전에 따라 버튼 속성 이름은 다를 수 있다. 통신 주기보다 짧은 펄스를 HMI 스크립트에서 만들지 말고, PLC의 ONS가 요청을 한 번만 받도록 한다. AVEVA의 InTouch 사례도 HMI와 I/O 서버의 처리 주기를 함께 고려해야 한다고 설명한다. [AVEVA InTouch pushbutton 사례](https://community.aveva.com/archive_portals/forum_archive_6_21_2007_view_only/f/intouch/16885/sending-a-discrete-with-a-pushbutton)

## 자동 복귀와 반복 누름

- 60초가 끝난 같은 스캔에 Active가 0이 된다.
- Active가 0이 된 다음 스캔에 TON의 ACC가 0으로 초기화된다.
- 우회 중 버튼을 다시 눌러도 타이머는 다시 시작되지 않는다.
- 요청 비트가 통신 장애로 1에 멈춰도 ONS 때문에 우회가 자동으로 재시작되지 않는다.
- Start와 Cancel이 동시에 들어오면 뒤 Rung의 Cancel이 우선한다.
- HMI 통신이 끊겨도 PLC는 60초 뒤 센서 사용으로 돌아간다.

## SFC는 이번에 바꾸지 않는다

`DoSeparation`은 `f_finger1_separated`와 `f_finger2_separated`를 읽는다. `MainRoutine`은 `BasicControl`을 먼저 실행하고 `SecondarySeparation`을 나중에 실행하므로, 우회 완료 판정은 뒤에서 실행되는 `DoSeparation`에 전달된다.

다음 원시 센서 전이는 이번 작업에서 바꾸지 않는다.

| 장비 | SFC 전이 |
|---|---|
| SM#1 | `Finger1Separate.Tran_099`, `Finger2Separate.Tran_103`이다. |
| SM#2 | `Finger1Separate.Tran_155`, `Finger2Separate.Tran_160`이다. |

이미 재시도 SFC가 동작 중일 때 버튼을 누르면 현재 스텝이나 타임아웃이 정리될 때까지 즉시 빠져나오지 않을 수 있다. 버튼을 누르는 순간 현재 동작을 강제로 끝내는 기능은 별도 검증이 필요하다.

## 시험할 항목

1. 버튼을 한 번 누르면 해당 SM의 Active만 켜지고 ACC가 증가하는지 확인한다.
2. 우회 중 버튼을 다시 눌러도 ACC가 초기화되지 않는지 확인한다.
3. 60초 뒤 Active가 자동으로 꺼지고 실제 센서 판정으로 돌아오는지 확인한다.
4. Cancel 버튼을 누르면 즉시 실제 센서 사용으로 돌아오는지 확인한다.
5. 우회 중에도 Finger Down이 없으면 완료 비트가 켜지지 않는지 확인한다.
6. SM#1과 SM#2의 버튼과 타이머가 서로 영향을 주지 않는지 확인한다.
7. HMI 통신을 끊어도 60초 뒤 자동으로 복귀하는지 확인한다.
8. 승인된 재기동 시험 뒤 Active가 0으로 시작하는지 확인한다.

이 글은 Offline L5X를 기준으로 만든 적용 설계안이다. 현장 InTouch 버전과 Access Name은 HMI 프로젝트 원본이 없어 확정하지 못했다. PLC Online 적용, Studio 5000 Verify와 실제 생산 시험도 아직 수행하지 않았다.
