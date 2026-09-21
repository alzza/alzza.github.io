# SM#1·SM#2 Finger Retry 스캔 재현

기준: Cathode1_260915.L5X (c09af47a9d79884231d944d78b94468480f8ff8e76e778d5e5f2b1d974561a7f).

원본 RLL과 수정 RLL을 같은 입력에 실행했다. Lower → Raise → Hammer → Flex → Lower 경로의 Step·Transition·조건은 원본에서 추출했다. Raise의 시도 횟수 한계, 위치 센서, Hammer 완료는 시험 입력으로 주입했다. 실제 유압·I/O·전체 SFC 스케줄과 시간 경과는 포함하지 않는다.

## SM#1 Finger 1 · 원본
하강 State_Lower_Finger1_001 → Tran_099 → 상승 State_raise_finger1_001 → Tran_100 → State_Hammer_Trial_001 → Tran_098 → State_Flex_2 → Tran_023 → 하강. 원본 PRE 2500 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger1_001 → State_Lower_Finger1_001 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger1_001 → State_raise_finger1_001 | Tran_099 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 3. State_raise_finger1_001: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger1_001 → State_raise_finger1_001 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger1_001 → State_Hammer_Trial_001 | Tran_100 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_001 → State_Flex_2 | Tran_098 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_2 → State_Lower_Finger1_001 | Tran_023 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 7. Retry 재하강: Down=1 | State_Lower_Finger1_001 → State_raise_finger1_001 | Tran_099 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_raise_finger1_001 → State_raise_finger1_001 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |

## SM#1 Finger 1 · 수정 후 OFF
하강 State_Lower_Finger1_001 → Tran_099 → 상승 State_raise_finger1_001 → Tran_100 → State_Hammer_Trial_001 → Tran_098 → State_Flex_2 → Tran_023 → 하강. 원본 PRE 2500 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger1_001 → State_Lower_Finger1_001 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger1_001 → State_raise_finger1_001 | Tran_099 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3. State_raise_finger1_001: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger1_001 → State_raise_finger1_001 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger1_001 → State_Hammer_Trial_001 | Tran_100 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_001 → State_Flex_2 | Tran_098 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_2 → State_Lower_Finger1_001 | Tran_023 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7. Retry 재하강: Down=1 | State_Lower_Finger1_001 → State_raise_finger1_001 | Tran_099 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_raise_finger1_001 → State_raise_finger1_001 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## SM#1 Finger 1 · 수정 후 ON
하강 State_Lower_Finger1_001 → Tran_099 → 상승 State_raise_finger1_001 → Tran_100 → State_Hammer_Trial_001 → Tran_098 → State_Flex_2 → Tran_023 → 하강. 원본 PRE 2500 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger1_001 → State_Lower_Finger1_001 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger1_001 → State_raise_finger1_001 | Tran_099 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3. State_raise_finger1_001: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger1_001 → State_raise_finger1_001 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger1_001 → State_Hammer_Trial_001 | Tran_100 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_001 → State_Flex_2 | Tran_098 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_2 → State_Lower_Finger1_001 | Tran_023 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 7. Retry 재하강: Down=1 | State_Lower_Finger1_001 → State_Lower_Finger1_001 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 1 |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_Lower_Finger1_001 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 1 |
| 9. Gate 양쪽 센서 도착 | 상위 완료 후 추적 중지 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | 1 |
| 10. 다음 스캔: Gate 신호로 우회 종료 | 상위 완료 후 추적 중지 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |

## SM#1 Finger 2 · 원본
하강 State_Lower_Finger_001 → Tran_103 → 상승 State_raise_finger_001 → Tran_104 → State_Hammer_Trial_002 → Tran_105 → State_Flex_1 → Tran_001 → 하강. 원본 PRE 2500 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger_001 → State_Lower_Finger_001 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger_001 → State_raise_finger_001 | Tran_103 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 3. State_raise_finger_001: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger_001 → State_raise_finger_001 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger_001 → State_Hammer_Trial_002 | Tran_104 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_002 → State_Flex_1 | Tran_105 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_1 → State_Lower_Finger_001 | Tran_001 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 7. Retry 재하강: Down=1 | State_Lower_Finger_001 → State_raise_finger_001 | Tran_103 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_raise_finger_001 → State_raise_finger_001 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |

## SM#1 Finger 2 · 수정 후 OFF
하강 State_Lower_Finger_001 → Tran_103 → 상승 State_raise_finger_001 → Tran_104 → State_Hammer_Trial_002 → Tran_105 → State_Flex_1 → Tran_001 → 하강. 원본 PRE 2500 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger_001 → State_Lower_Finger_001 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger_001 → State_raise_finger_001 | Tran_103 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3. State_raise_finger_001: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger_001 → State_raise_finger_001 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger_001 → State_Hammer_Trial_002 | Tran_104 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_002 → State_Flex_1 | Tran_105 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_1 → State_Lower_Finger_001 | Tran_001 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7. Retry 재하강: Down=1 | State_Lower_Finger_001 → State_raise_finger_001 | Tran_103 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_raise_finger_001 → State_raise_finger_001 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## SM#1 Finger 2 · 수정 후 ON
하강 State_Lower_Finger_001 → Tran_103 → 상승 State_raise_finger_001 → Tran_104 → State_Hammer_Trial_002 → Tran_105 → State_Flex_1 → Tran_001 → 하강. 원본 PRE 2500 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger_001 → State_Lower_Finger_001 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger_001 → State_raise_finger_001 | Tran_103 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3. State_raise_finger_001: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger_001 → State_raise_finger_001 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger_001 → State_Hammer_Trial_002 | Tran_104 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_002 → State_Flex_1 | Tran_105 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_1 → State_Lower_Finger_001 | Tran_001 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 7. Retry 재하강: Down=1 | State_Lower_Finger_001 → State_Lower_Finger_001 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 1 |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_Lower_Finger_001 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 1 |
| 9. Gate 양쪽 센서 도착 | 상위 완료 후 추적 중지 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | 1 |
| 10. 다음 스캔: Gate 신호로 우회 종료 | 상위 완료 후 추적 중지 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |

## SM#2 Finger 1 · 원본
하강 State_Lower_Finger1_003 → Tran_155 → 상승 State_raise_finger1_003 → Tran_154 → State_Hammer_Trial_004 → Tran_156 → State_Flex_2 → Tran_023 → 하강. 원본 PRE 2000 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger1_003 → State_Lower_Finger1_003 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger1_003 → State_raise_finger1_003 | Tran_155 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 3. State_raise_finger1_003: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger1_003 → State_raise_finger1_003 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger1_003 → State_Hammer_Trial_004 | Tran_154 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_004 → State_Flex_2 | Tran_156 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_2 → State_Lower_Finger1_003 | Tran_023 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 7. Retry 재하강: Down=1 | State_Lower_Finger1_003 → State_raise_finger1_003 | Tran_155 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_raise_finger1_003 → State_raise_finger1_003 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |

## SM#2 Finger 1 · 수정 후 OFF
하강 State_Lower_Finger1_003 → Tran_155 → 상승 State_raise_finger1_003 → Tran_154 → State_Hammer_Trial_004 → Tran_156 → State_Flex_2 → Tran_023 → 하강. 원본 PRE 2000 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger1_003 → State_Lower_Finger1_003 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger1_003 → State_raise_finger1_003 | Tran_155 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3. State_raise_finger1_003: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger1_003 → State_raise_finger1_003 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger1_003 → State_Hammer_Trial_004 | Tran_154 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_004 → State_Flex_2 | Tran_156 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_2 → State_Lower_Finger1_003 | Tran_023 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7. Retry 재하강: Down=1 | State_Lower_Finger1_003 → State_raise_finger1_003 | Tran_155 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_raise_finger1_003 → State_raise_finger1_003 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## SM#2 Finger 1 · 수정 후 ON
하강 State_Lower_Finger1_003 → Tran_155 → 상승 State_raise_finger1_003 → Tran_154 → State_Hammer_Trial_004 → Tran_156 → State_Flex_2 → Tran_023 → 하강. 원본 PRE 2000 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger1_003 → State_Lower_Finger1_003 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger1_003 → State_raise_finger1_003 | Tran_155 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3. State_raise_finger1_003: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger1_003 → State_raise_finger1_003 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger1_003 → State_Hammer_Trial_004 | Tran_154 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_004 → State_Flex_2 | Tran_156 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_2 → State_Lower_Finger1_003 | Tran_023 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 7. Retry 재하강: Down=1 | State_Lower_Finger1_003 → State_Lower_Finger1_003 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 1 |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_Lower_Finger1_003 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 1 |
| 9. Gate 양쪽 센서 도착 | 상위 완료 후 추적 중지 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | 1 |
| 10. 다음 스캔: Gate 신호로 우회 종료 | 상위 완료 후 추적 중지 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |

## SM#2 Finger 2 · 원본
하강 State_Lower_Finger_003 → Tran_160 → 상승 State_raise_finger_003 → Tran_157 → State_Hammer_Trial_005 → Tran_159 → State_Flex_1 → Tran_001 → 하강. 원본 PRE 2000 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger_003 → State_Lower_Finger_003 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger_003 → State_raise_finger_003 | Tran_160 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 3. State_raise_finger_003: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger_003 → State_raise_finger_003 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger_003 → State_Hammer_Trial_005 | Tran_157 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_005 → State_Flex_1 | Tran_159 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_1 → State_Lower_Finger_003 | Tran_001 | 0 | 1/1 | 0 | 0 | 0 | 0 | — | — | 0 | — |
| 7. Retry 재하강: Down=1 | State_Lower_Finger_003 → State_raise_finger_003 | Tran_160 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_raise_finger_003 → State_raise_finger_003 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 0 | — | — | 0 | — |

## SM#2 Finger 2 · 수정 후 OFF
하강 State_Lower_Finger_003 → Tran_160 → 상승 State_raise_finger_003 → Tran_157 → State_Hammer_Trial_005 → Tran_159 → State_Flex_1 → Tran_001 → 하강. 원본 PRE 2000 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger_003 → State_Lower_Finger_003 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger_003 → State_raise_finger_003 | Tran_160 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3. State_raise_finger_003: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger_003 → State_raise_finger_003 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger_003 → State_Hammer_Trial_005 | Tran_157 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_005 → State_Flex_1 | Tran_159 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_1 → State_Lower_Finger_003 | Tran_001 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7. Retry 재하강: Down=1 | State_Lower_Finger_003 → State_raise_finger_003 | Tran_160 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_raise_finger_003 → State_raise_finger_003 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## SM#2 Finger 2 · 수정 후 ON
하강 State_Lower_Finger_003 → Tran_160 → 상승 State_raise_finger_003 → Tran_157 → State_Hammer_Trial_005 → Tran_159 → State_Flex_1 → Tran_001 → 하강. 원본 PRE 2000 ms는 경과 시간을 계산하지 않고 참고값으로만 표시한다.

| 단계 | SFC Step → 다음 Step | 성립한 전이 | 실패 시험 주입 | No Copper 실제/판단 | Down | DN | 완료 비트 | 상위 완료 전이 | Pending | Active | Gate | Enable |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1. 첫 하강: 아직 Down=0 | State_Lower_Finger_003 → State_Lower_Finger_003 | 없음 | 0 | 1/1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 2. Down=1, No Copper=1: Raise로 전이 | State_Lower_Finger_003 → State_raise_finger_003 | Tran_160 | 0 | 1/1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| 3. State_raise_finger_003: 시도 횟수 상한 도달을 시험 주입 | State_raise_finger_003 → State_raise_finger_003 | 없음 | 1 | 1/1 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| 4. Finger Up·Flex 복귀 입력: Hammer로 전이 | State_raise_finger_003 → State_Hammer_Trial_005 | Tran_157 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 5. Hammer 완료 입력: Flex로 전이 | State_Hammer_Trial_005 → State_Flex_1 | Tran_159 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 6. Flex 전진 입력: Lower로 재진입 | State_Flex_1 → State_Lower_Finger_003 | Tran_001 | 0 | 1/0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 |
| 7. Retry 재하강: Down=1 | State_Lower_Finger_003 → State_Lower_Finger_003 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 1 |
| 8. 다음 Program 스캔: 상위 완료 전이 평가 | State_Lower_Finger_003 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 1 | 0 | 1 | 0 | 1 |
| 9. Gate 양쪽 센서 도착 | 상위 완료 후 추적 중지 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/0 | 1 | 0 | 1 | 1 | 0 | 1 | 1 | 1 |
| 10. 다음 스캔: Gate 신호로 우회 종료 | 상위 완료 후 추적 중지 → 상위 완료 후 추적 중지 | 없음 | 0 | 1/1 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 1 |
