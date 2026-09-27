---
title: CSM#1 VISION 등급소실 원인분석 Rev.2
date: "2026-09-27"
excerpt: HMI의 등급 없음 표시를 기준으로 VISION 판정, CATHODE 1 수신·보존, R1 Tracking, SM Drop을 양쪽 PLC의 8태그 Trend 3개씩으로 확인하는 절차다.
kicker: PLC
tags: ["PLC", "VISION", "Robot1", "InTouch", "CSM", "Timing"]
---

## Rev.2에서 바뀐 내용

- VISION PLC와 CATHODE 1 PLC를 각각 8태그 Trend 3개로 정리했다.
- `zp_Vision_Write[0]`을 DINT 32 bit의 bit field로 설명하고, 등급별 bit와 mask를 넣었다.
- R4, VISION DIE, R1, SM#1·SM#2의 물리 handshake와 Tracking 데이터 이동을 한 흐름으로 정리했다.
- VISION의 `CHECK` 번호와 CATHODE Tracking의 `Weight` 번호가 다르다는 점을 분리했다.

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

| 등급 | VISION 원입력 | VISION 출력 alias | 송신 bit | mask 값 | CATHODE 1 수신 alias |
|---|---|---|---:|---:|---|
| S | `Local:4:I.Data.2` | `o_csm_Grade_S` | `.16` | 65,536 | `R4_i_Die_S_Grade_Signal` |
| E | `Local:4:I.Data.3` | `o_csm_Grade_E` | `.17` | 131,072 | `R4_i_Die_E_Grade_Signal` |
| G | `Local:4:I.Data.1` | `o_csm_Grade_G` | `.18` | 262,144 | `R4_i_Die_G_Grade_Signal` |
| R | `Local:4:I.Data.15` | `o_csm_Grade_R` | `.4` | 16 | `R4_i_Die_R_Grade_Signal` |

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
