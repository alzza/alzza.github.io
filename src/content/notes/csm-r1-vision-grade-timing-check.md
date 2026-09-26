---
title: CSM Robot #1 Vision 등급 전달 타이밍 점검서
date: "2026-09-26"
excerpt: Vision 판정부터 Robot #1, SM#1·SM#2까지의 등급 전달 흐름을 정리하고, 타이머를 한 번에 하나씩 바꾸며 원인을 분리하는 현장 점검 절차다.
kicker: PLC
tags: ["PLC", "Vision", "Robot1", "FANUC", "InTouch", "CSM", "Timing"]
---

## 먼저 결론

4000장 가운데 약 10~14회만 발생한다면, 항상 틀린 I/O 매핑보다는 Vision 판정 결과가 Robot1의 등급 대기 시간보다 늦거나, 짧게 나온 등급 신호가 다음 단계에서 사라지는 경우를 먼저 의심할 수 있다. 다만 현재 파일만으로 현장 원인을 확정할 수는 없다. 같은 시각의 Vision, Cathode1, FANUC 신호를 함께 남겨야 한다.

타이머를 한 번에 여러 개 바꾸면 원인을 알 수 없다. 첫 시험에서는 Cathode1의 `Robot1.TON_01.PRE`만 `4000 ms`에서 `5000 ms`로 바꾼다. 이 값은 등급을 기다리다가, 등급이 없어도 Pickup Tracking을 강제로 진행하는 기준 시간이다. Vision의 `RESET_GR`과 Robot1의 `DELAY`는 첫 시험에서 바꾸지 않는다.

이 글은 제공받은 `VISION_CSM1.L5K`, `Cathode1.L5X`, Robot #1 PE 파일을 읽어서 작성한 오프라인 점검서다. 실제 Controller Online 상태, 현장 ACD, Vision 프로그램과 일치하는지는 입력 전에 반드시 대조해야 한다. 이 글만으로 PLC나 Robot 프로그램을 변경하지 않는다.

## 등급 전달 흐름

<iframe src="/diagrams/csm-r1-grade-timing-dataflow.html?embed=1" title="CSM Robot #1 등급 전달과 타임아웃 판정 다이어그램" loading="lazy" style="width:100%;height:620px;border:0;"></iframe>

[새 창에서 도식 열기](/diagrams/csm-r1-grade-timing-dataflow.html)

정상 흐름은 다음과 같다.

```text
카메라·ML 등급 판정
→ VISION_CSM1 o_csm_Grade_S/E/G/R
→ Cathode1 Robot1 R4_S/E/G/R_Grade
→ Track_Infeed_Robot1_Pickup_Bar
→ a_cathode[11].Weight → a_cathode[7].Weight
→ FANUC BLOAD_1 또는 BLOAD_2
→ DO[2] 또는 DO[3] Loaded Pulse
→ SM#1 또는 SM#2 Drop Tracking
→ a_cathode[9] 또는 a_cathode[12]
```

그리퍼 오픈은 등급을 새로 전달하는 시점이 아니다. `BLOAD_1.PE`와 `BLOAD_2.PE`는 `CALL OPEN` 뒤에 각각 `DO[2]`, `DO[3] Loaded Pulse`를 1초간 출력한다. Cathode1은 이 로딩 신호를 받고 이미 `a_cathode[7]`에 저장된 Weight를 SM 목적지로 옮긴다.

## 원본에서 확인한 타이머와 역할

| 우선순위 | Controller / Program | Tag | 현재값 | 실제 역할 | 첫 시험에서 변경 여부 |
|---:|---|---|---:|---|---|
| 1 | Cathode1 / `Robot1` / `prod_tracking` Rung 9 | `TON_01.PRE` | 4000 ms | 등급 대기 최대 시간이다. 만료되어도 Pickup Tracking을 진행한다. | 변경한다. |
| 2 | VISION_CSM1 / `AUTO` | `RESET_GR.PRE` | 300 ms | `o_csm_Grade_*` 출력 래치를 유지하는 시간이다. | 첫 시험에서는 유지한다. |
| 3 | Cathode1 / `Robot1` / `Background` Rung 83~84 | `DELAY.PRE` | 700 ms | Robot1 내부 `R4_*_Grade` 래치를 유지하는 시간이다. | 첫 시험에서는 유지한다. |
| 해당 없음 | FANUC `BLOAD_1.PE`, `BLOAD_2.PE` | 없음 | - | 그리퍼 오픈과 Loaded Pulse를 실행한다. Vision 등급 대기 타이머는 없다. | 변경하지 않는다. |

`TON_01.DN`은 `zTimeOverGrade`를 Set한다. 동시에 `z_Get_R1_Pickup_Bar`가 발생하면 `Track_Infeed_Robot1_Pickup_Bar`가 실행된다. 이 Routine은 R4 등급 비트가 하나도 켜지지 않았으면 `a_cathode[11].Weight`를 쓰지 않은 채 `a_cathode[7]`으로 이동시킨다. 그 결과 Weight가 0인 제품이 SM으로 갈 수 있다.

SM Drop Routine은 이동 전에 `a_cathode[7].Weight = 0`을 검사한다.

```text
SM#1: a_cathode[7].Weight = 0 → z_sm1_Grade_None := 1
SM#2: a_cathode[7].Weight = 0 → z_sm2_Grade_None := 1
```

현재 확인한 원본에서는 `z_sm1_Grade_None`, `z_sm2_Grade_None`을 Set하는 쓰기는 확인했지만, 이를 0으로 되돌리는 쓰기는 찾지 못했다. 따라서 HMI의 “등급 없음”은 현재 제품의 즉시 상태가 아니라 과거 이벤트가 남아 있는 표시일 수도 있다. 현장 수정본과 ACD에서 Reset 또는 HMI 쓰기 위치를 다시 확인해야 한다.

## 현장에서 먼저 해야 할 일

### 1. 변경 전 기준을 남긴다

1. 현장 Controller의 ACD와 L5X를 날짜와 시간까지 붙여 별도 보관한다.
2. Vision PLC, Cathode1 PLC, Robot #1의 날짜·시간을 비교한다. 시간대가 다르면 이벤트 순서를 해석할 수 없다.
3. 현재 `TON_01.PRE=4000`, `RESET_GR.PRE=300`, `DELAY.PRE=700`을 화면 캡처와 Trend 내보내기로 남긴다.
4. HMI “등급 없음” 표시가 뜬 시각, 해당 제품의 Serial·Lot·생산 번호와 SM#1 또는 SM#2를 기록한다.
5. 현장에 이미 적용된 온라인 편집이 있으면 원본 L5X와 비교한다. 이 문서의 Rung 번호만 보고 입력하지 않는다.

### 2. 같은 시간축으로 Trend를 남긴다

한 Controller의 화면만 보면 원인을 분리할 수 없다. 아래 신호를 같은 사건 기준으로 저장한다. 권장 구간은 `zTimeOverGrade`가 켜지는 시점 또는 `z_sm*_Grade_None`이 켜지는 시점의 앞 10초, 뒤 10초다. 시스템이 허용하면 더 길게 남긴다.

#### VISION_CSM1 PLC Trend

```text
i_Servo2_Ready_Status
Local:4:I.Data.1
Local:4:I.Data.2
Local:4:I.Data.3
Local:4:I.Data.15
GRADE_S
GRADE_E
GRADE_G
GRADE_R
o_csm_Grade_S
o_csm_Grade_E
o_csm_Grade_G
o_csm_Grade_R
RESET_GR.EN
RESET_GR.ACC
RESET_GR.DN
```

이 로그로 ML 결과가 Vision PLC 입력까지 실제 들어왔는지, `i_Servo2_Ready_Status`가 당시 1이었는지, 출력 래치가 300ms 동안 유지됐는지를 확인한다.

#### Cathode1 PLC, Robot1 Program Trend

```text
R4_i_Die_S_Grade_Signal
R4_i_Die_E_Grade_Signal
R4_i_Die_G_Grade_Signal
R4_i_Die_R_Grade_Signal
R4_S_Grade
R4_E_Grade
R4_G_Grade
R4_R_Grade
DELAY.EN
DELAY.ACC
DELAY.DN
z_R1_Pickup_Bar
TON_01.EN
TON_01.ACC
TON_01.DN
z_Get_R1_Pickup_Bar
zTimeOverGrade
z_GradeBackup
a_cathode[11].Weight
a_cathode[7].Weight
```

이 로그가 가장 중요하다. `TON_01.DN=1`이고 `R4_*_Grade`가 모두 0이면, Robot1이 등급 없이 다음 단계로 진행했다는 뜻이다.

#### SM#1·SM#2 및 HMI 확인 신호

```text
i_sm1_loaded
i_sm2_loaded
z_signal_r1_sm1_loaded
z_signal_r1_sm2_loaded
z_R1_sm1_Drop_done
z_R1_sm2_Drop_done
a_cathode[9].Weight
a_cathode[12].Weight
z_sm1_Grade_None
z_sm2_Grade_None
z_GradeFault
```

여기서는 빈 Weight가 어느 SM으로 옮겨졌는지, 또는 HMI 표시만 과거 상태로 남은 것인지를 구분한다.

#### FANUC Robot #1에서 같이 보관할 항목

```text
DO[18:VISION_OK_ON]
DO[7:Gripper Open]
DO[8:Gripper Closed]
DO[2:Loaded 1 Pulse]
DO[3:Loaded 2 Pulse]
DI[4:Load Sta. 1]
DI[5:Load Sta. 2]
DI[12:R2 Clear of 1]
DI[13:R2 Clear of 2]
```

FANUC I/O 화면 또는 I/O 설정 백업으로 `DO[2]`와 `DO[3]`이 실제 Cathode1의 `i_sm1_loaded`, `i_sm2_loaded`에 각각 연결되는지도 대조한다. PE 파일만으로는 이 통신 매핑을 확정할 수 없다.

## 로그를 읽는 순서

아래 순서대로 보면 같은 실패를 서로 다른 원인으로 잘못 해석하는 일을 줄일 수 있다.

| 순서 | 확인할 조건 | 판단 |
|---:|---|---|
| 1 | Vision의 `Local:4:I.Data.*`에 등급 입력이 있었는가 | 없으면 카메라·ML 결과 또는 Vision 입력 문제를 먼저 확인한다. |
| 2 | 입력 당시 `i_Servo2_Ready_Status=1`이었는가 | 0이면 Vision은 `GRADE_*`와 `o_csm_Grade_*`를 만들지 않는다. |
| 3 | `o_csm_Grade_*`가 켜졌는가 | 안 켜졌으면 Vision 내부 조건 또는 300ms 래치 이전 문제다. |
| 4 | Cathode1의 `R4_i_Die_*`와 `R4_*_Grade`가 켜졌는가 | Vision 출력은 있었는데 여기서 없으면 통신·RPI·소비 태그를 확인한다. |
| 5 | `TON_01.DN`이 먼저 켜졌는가 | 먼저 켜졌으면 Robot1의 4초 등급 대기 시간이 끝난 것이다. |
| 6 | `a_cathode[11].Weight`가 0이었는가 | 0이면 SM 이전, Robot1 Pickup 단계에서 이미 등급이 비어 있었다. |
| 7 | `a_cathode[7].Weight`가 0이었는가 | 0이면 SM Drop Routine이 Grade None을 Set할 조건이 갖춰졌다. |
| 8 | `a_cathode[7].Weight`는 정상인데 `z_sm*_Grade_None=1`인가 | HMI Grade None 태그가 이전 사건부터 남아 있을 가능성을 확인한다. |

## 타이머 시험안: 한 번에 하나만 바꾼다

각 시험은 같은 생산 조건에서 시행하고, 시험 시작·종료 시각과 설정값을 기록한다. 시험 중 알람이나 품질 판단에 영향이 생기면 즉시 원래값으로 복귀한다.

### 시험 0: 현재값 기준 로그 확보

```text
TON_01.PRE = 4000 ms
RESET_GR.PRE = 300 ms
DELAY.PRE = 700 ms
```

목적은 기준선을 만드는 것이다. `zTimeOverGrade`가 실제로 켜지는지, 그리고 그때 `R4_*_Grade`와 Weight가 어떤 값인지 확인한다.

### 시험 1: `TON_01.PRE`만 5000ms로 변경

대상:

```text
Cathode1
Program: Robot1
Routine: prod_tracking
Rung: 9
Tag: TON_01.PRE
4000 → 5000 ms
```

예상되는 결과는 다음과 같다.

| 결과 | 해석 | 다음 조치 |
|---|---|---|
| `zTimeOverGrade`와 Grade None 발생이 뚜렷하게 줄어든다 | Vision 결과가 4초를 조금 넘겨 도착하는 경우가 유력하다. | 5000ms를 유지한 상태에서 충분한 생산 수량을 추가 관찰한다. |
| `zTimeOverGrade`는 줄지 않는다 | 단순 대기시간 부족만의 문제는 아닐 수 있다. | Vision 출력과 Cathode1 수신 로그를 비교한다. |
| 생산 흐름이 1초 더 늦어져도 품질 이상은 없다 | 대기 연장에 따른 영향이 제한적일 수 있다. | 운영 승인 후 다음 단계 여부를 정한다. |
| 다른 제품의 등급이 붙는다 | 대기시간 연장은 중단하고 원래값으로 복귀한다. | 제품-등급 연결 조건을 먼저 분석한다. |

5000ms 시험에서도 `TON_01.DN=1`이 반복되고 Vision 결과가 늦게 들어온 사실이 확인될 때만, 별도 시험으로 `6000ms`를 검토한다. 4000에서 바로 큰 값으로 올리지 않는다.

### 시험 2: Vision `RESET_GR.PRE`만 500ms로 변경

이 시험은 Vision에서 `o_csm_Grade_*`가 실제로 나왔지만 Cathode1의 `R4_i_Die_*` 또는 `R4_*_Grade`가 빠지는 증거가 있을 때만 시행한다.

```text
VISION_CSM1
Routine: AUTO
Tag: RESET_GR.PRE
300 → 500 ms
```

이 타이머는 ML 판정 자체를 빠르게 만들지 않는다. 이미 나온 Vision 등급 출력을 더 오래 유지할 뿐이다. 너무 길게 유지하면 이전 제품 등급이 다음 제품에 남을 수 있으므로, 첫 변경은 500ms까지만 한다.

### 시험 3: Robot1 `DELAY.PRE`만 1000ms로 변경

이 시험은 Cathode1에서 `R4_*_Grade`가 켜졌지만, Pickup Tracking 전에 700ms를 넘겨 꺼지는 증거가 있을 때만 시행한다.

```text
Cathode1
Program: Robot1
Routine: Background
Rung: 83~84
Tag: DELAY.PRE
700 → 1000 ms
```

`DELAY`를 먼저 늘리면 Vision이 아예 등급을 보내지 않은 문제를 가릴 수 있다. 따라서 `TON_01`과 Vision 출력 확인보다 앞서 변경하지 않는다.

## 변경하지 말아야 할 것

- `BLOAD_1.PE`, `BLOAD_2.PE`의 `WAIT` 조건과 1초 Loaded Pulse는 현재 등급 대기 시간이 아니다.
- Vision, Cathode1, FANUC 타이머를 같은 시험에서 함께 바꾸지 않는다.
- `z_sm1_Grade_None`, `z_sm2_Grade_None`을 현장 HMI에서 임의로 0으로 쓰지 않는다. 먼저 누가 Set하고 누가 Reset해야 하는지 현장 L5X와 HMI 태그 설정을 확인한다.
- `TON_01`을 늘린 뒤 발생 횟수만 보고 즉시 원인 확정하지 않는다. 같은 실패 건의 Vision 입력, R4 등급, Weight, `zTimeOverGrade` 순서를 확인한다.

## 원본 위치

| 파일 | 확인한 내용 |
|---|---|
| [VISION_CSM1.L5K](/Users/akanus/Desktop/VISION_CSM1.L5K:1473) | Vision 입력, `i_Servo2_Ready_Status`, `o_csm_Grade_*`, `RESET_GR` 등급 출력 래치 로직이다. |
| [Cathode1.L5X](/Users/akanus/Desktop/Cathode1.L5X:54159) | Robot1 `prod_tracking`의 `TON_01`, `zTimeOverGrade`, Pickup Tracking 명령 로직이다. |
| [Cathode1.L5X](/Users/akanus/Desktop/Cathode1.L5X:35535) | `R4_*_Grade`를 `a_cathode[11].Weight`로 기록하고 `a_cathode[7]`으로 옮기는 ST Routine이다. |
| [Cathode1.L5X](/Users/akanus/Desktop/Cathode1.L5X:35807) | SM#1·SM#2 Drop 전에 `a_cathode[7].Weight=0`이면 Grade None을 Set하는 Routine이다. |
| [BLOAD_1.PE](</Users/akanus/Desktop/CSM1_PE변환 프로그램/R1/BLOAD_1.PE:34>) | SM#1에서 `CALL OPEN` 뒤 `DO[2] Loaded 1 Pulse`를 출력하는 순서다. |
| [BLOAD_2.PE](</Users/akanus/Desktop/CSM1_PE변환 프로그램/R1/BLOAD_2.PE:27>) | SM#2에서 `CALL OPEN` 뒤 `DO[3] Loaded 2 Pulse`를 출력하는 순서다. |
| [OPEN.PE](</Users/akanus/Desktop/CSM1_PE변환 프로그램/R1/OPEN.PE:22>) | 클램프 Open 입력 확인 뒤 `DO[7:Gripper Open]`을 켜는 프로그램이다. |

## 현장 점검 완료 기준

다음 네 가지가 같은 실패 건에서 확보되어야 원인을 좁힐 수 있다.

1. Vision 원시 등급 입력과 `o_csm_Grade_*`의 시각이다.
2. Cathode1의 `R4_*_Grade`, `TON_01`, `zTimeOverGrade`의 시각이다.
3. `a_cathode[11].Weight`, `a_cathode[7].Weight`, SM 목적지 Weight의 값이다.
4. FANUC Loaded Pulse와 SM 로딩 입력의 연결 관계다.

이 네 가지 중 하나라도 빠지면 “Vision이 늦었다”와 “HMI 표시가 이전 상태로 남았다”를 구분할 수 없다. 먼저 로그를 확보하고, 그 다음에 한 타이머만 바꾸는 순서를 지킨다.
