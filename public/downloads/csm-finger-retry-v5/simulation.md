# SM#1·SM#2 Finger Retry 스캔 재현

기준: Cathode1_260915.L5X (c09af47a9d79884231d944d78b94468480f8ff8e76e778d5e5f2b1d974561a7f).

원본 RLL과 수정 RLL을 같은 입력에 실행했다. SFC 조건·Step 이름·PRE는 원본에서 추출했다. 실패는 해당 Finger의 Raise Step에서 재시도 횟수가 한계에 도달한 경우를 가정한다. 실제 유압·I/O·전체 SFC 스케줄은 포함하지 않는다.

## SM#1 Finger 1 · 원본
하강 State_Lower_Finger1_001 → Tran_099 (2500 ms) → 상승 State_raise_finger1_001; 실패 발생 State_raise_finger1_001; 상위 완료 Tran_073, Tran_094.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 3. State_Lower_Finger1_001.DN(2500 ms), State_raise_finger1_001 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |

## SM#1 Finger 1 · 수정 후 OFF
하강 State_Lower_Finger1_001 → Tran_099 (2500 ms) → 상승 State_raise_finger1_001; 실패 발생 State_raise_finger1_001; 상위 완료 Tran_073, Tran_094.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3. State_Lower_Finger1_001.DN(2500 ms), State_raise_finger1_001 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## SM#1 Finger 1 · 수정 후 ON
하강 State_Lower_Finger1_001 → Tran_099 (2500 ms) → 상승 State_raise_finger1_001; 실패 발생 State_raise_finger1_001; 상위 완료 Tran_073, Tran_094.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3. State_Lower_Finger1_001.DN(2500 ms), State_raise_finger1_001 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 1 |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/0 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 1 |
| 6. Gate 양쪽 센서 도착 | 1/0 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 | 1 |
| 7. 다음 스캔: Gate 신호로 우회 종료 | 1/1 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |

## SM#1 Finger 2 · 원본
하강 State_Lower_Finger_001 → Tran_103 (2500 ms) → 상승 State_raise_finger_001; 실패 발생 State_raise_finger_001; 상위 완료 Tran_083, Tran_097.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 3. State_Lower_Finger_001.DN(2500 ms), State_raise_finger_001 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |

## SM#1 Finger 2 · 수정 후 OFF
하강 State_Lower_Finger_001 → Tran_103 (2500 ms) → 상승 State_raise_finger_001; 실패 발생 State_raise_finger_001; 상위 완료 Tran_083, Tran_097.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3. State_Lower_Finger_001.DN(2500 ms), State_raise_finger_001 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## SM#1 Finger 2 · 수정 후 ON
하강 State_Lower_Finger_001 → Tran_103 (2500 ms) → 상승 State_raise_finger_001; 실패 발생 State_raise_finger_001; 상위 완료 Tran_083, Tran_097.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3. State_Lower_Finger_001.DN(2500 ms), State_raise_finger_001 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 1 |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/0 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 1 |
| 6. Gate 양쪽 센서 도착 | 1/0 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 | 1 |
| 7. 다음 스캔: Gate 신호로 우회 종료 | 1/1 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |

## SM#2 Finger 1 · 원본
하강 State_Lower_Finger1_003 → Tran_155 (2000 ms) → 상승 State_raise_finger1_003; 실패 발생 State_raise_finger1_003; 상위 완료 Tran_142, Tran_151.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 3. State_Lower_Finger1_003.DN(2000 ms), State_raise_finger1_003 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |

## SM#2 Finger 1 · 수정 후 OFF
하강 State_Lower_Finger1_003 → Tran_155 (2000 ms) → 상승 State_raise_finger1_003; 실패 발생 State_raise_finger1_003; 상위 완료 Tran_142, Tran_151.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3. State_Lower_Finger1_003.DN(2000 ms), State_raise_finger1_003 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## SM#2 Finger 1 · 수정 후 ON
하강 State_Lower_Finger1_003 → Tran_155 (2000 ms) → 상승 State_raise_finger1_003; 실패 발생 State_raise_finger1_003; 상위 완료 Tran_142, Tran_151.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3. State_Lower_Finger1_003.DN(2000 ms), State_raise_finger1_003 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 1 |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/0 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 1 |
| 6. Gate 양쪽 센서 도착 | 1/0 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 | 1 |
| 7. 다음 스캔: Gate 신호로 우회 종료 | 1/1 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |

## SM#2 Finger 2 · 원본
하강 State_Lower_Finger_003 → Tran_160 (2000 ms) → 상승 State_raise_finger_003; 실패 발생 State_raise_finger_003; 상위 완료 Tran_124, Tran_129.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 3. State_Lower_Finger_003.DN(2000 ms), State_raise_finger_003 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | — | — | 0 | — |

## SM#2 Finger 2 · 수정 후 OFF
하강 State_Lower_Finger_003 → Tran_160 (2000 ms) → 상승 State_raise_finger_003; 실패 발생 State_raise_finger_003; 상위 완료 Tran_124, Tran_129.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3. State_Lower_Finger_003.DN(2000 ms), State_raise_finger_003 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## SM#2 Finger 2 · 수정 후 ON
하강 State_Lower_Finger_003 → Tran_160 (2000 ms) → 상승 State_raise_finger_003; 실패 발생 State_raise_finger_003; 상위 완료 Tran_124, Tran_129.

| 단계 | No Copper 실제/판단 | Down | DN | 하위 상승 전이 | 완료 비트 | 상위 완료 전이 | 실패 | Pending | Active | Gate | Enable |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2. Down=1, No Copper=1 | 1/1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3. State_Lower_Finger_003.DN(2000 ms), State_raise_finger_003 실패 | 1/1 | 1 | 1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 4. Retry 재하강: 실패 비트는 Permits에서 해제됨 | 1/0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 | 0 | 1 |
| 5. 다음 Program 스캔: 상위 완료 전이 평가 | 1/0 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 1 |
| 6. Gate 양쪽 센서 도착 | 1/0 | 1 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 1 | 1 |
| 7. 다음 스캔: Gate 신호로 우회 종료 | 1/1 | 1 | 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
