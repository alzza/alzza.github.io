---
title: T2CAN Universal v3.7.2 메뉴 한글 설명서
date: "2026-09-28"
excerpt: T2CAN Universal 대시보드의 HOME, DEVICES, SETTINGS, LAB 메뉴와 저장 범위를 실제 펌웨어 코드 기준으로 설명합니다.
tags:
  - T2CAN
  - Tesla
  - CAN
  - 설명서
---

이 글은 T2CAN Universal v3.7.2 대시보드의 메뉴를 한국어로 설명합니다. 화면에 표시되는 영문 이름을 함께 적었으므로 실제 메뉴를 찾을 때 그대로 사용할 수 있습니다.

이 설명서는 실제 펌웨어에 포함된 대시보드 문구와 설정 처리 코드를 기준으로 작성했습니다. ESP32-S3 컴파일은 확인했지만 보드 연결, 차량별 CAN 배선, 실차 동작은 확인하지 않았습니다. 따라서 화면의 `TX OK`는 보드가 송신을 처리했다는 뜻이며, 차량이 그 신호를 받아 원하는 동작을 했다는 뜻은 아닙니다.

## 먼저 알아둘 용어

| 화면 용어 | 설명 |
| --- | --- |
| AP, AUTOPILOT | 차량에서 수신한 오토파일럿 상태입니다. 단순히 기능 스위치를 켰다는 표시가 아닙니다. |
| NAG, Hands-On, HO | 운전자에게 조향 참여를 요구하는 경고와 관련된 CAN 값입니다. HO 숫자가 카메라 주시를 확인했다는 뜻은 아닙니다. |
| ALC, ULC | 자동 차선 변경과 차선 변경 관련 필드입니다. 같은 기능처럼 보여도 서로 다른 CAN 필드를 다룰 수 있습니다. |
| RX, TX | 수신과 송신입니다. |
| STOCK | 차량이 보낸 원래 값을 유지합니다. `OFF`와 같은 뜻이 아닙니다. |
| Gate, Blocked | 송신 허용 조건과 차단 상태입니다. AP 상태, 원본 프레임의 신선도, CAN 복구 상태가 조건에 포함됩니다. |
| NVS, Saved | 전원을 꺼도 남는 저장 설정입니다. |
| RAM-only, Session | 현재 주행 또는 현재 실행 중에만 남는 임시 설정입니다. |
| CAN A, CAN B | T2CAN의 두 CAN 통신 경로입니다. 실제 역할은 차량 프로필과 배선에 따라 달라집니다. |

## 첫 연결과 차량 프로필

기본 Wi-Fi 접속점은 `T2CAN-****`이고 기본 비밀번호는 `12345678`입니다. 브라우저에서 `http://192.168.4.1`을 열면 대시보드가 표시됩니다. 첫 실행에는 `PROFILE SETUP MODE`가 열립니다.

### 차량과 CAN 연결

| 메뉴 | 설명 |
| --- | --- |
| Model Y L | Party CAN + VH CAN 구성이 고정된 Y L 프로필입니다. |
| Model Y Juniper, Model Y Legacy | 실제 연결에 맞춰 Body + Chassis 또는 Party + Chassis를 선택합니다. |
| Model 3 Highland, Model 3 Legacy | 실제 연결에 맞춰 표준 CAN 구성을 선택합니다. Highland는 방향지시등 조작 방식도 선택합니다. |
| Steering wheel buttons | Highland의 스토크리스 방향지시등 버튼 방식입니다. |
| Turn stalk | Highland의 방향지시등 레버 방식입니다. |
| Save Profile & Reboot | 선택한 프로필을 저장하고 재부팅합니다. |

프로필을 저장하기 전에는 CAN 송신과 신호 주입이 안전 상태로 유지됩니다. 실제 차량 배선과 다른 프로필을 고르면 기능 지원 표시와 CAN 경로가 잘못될 수 있으므로, 메뉴를 보이게 하려고 임의의 프로필을 선택하면 안 됩니다.

### 프로필별 대표 기능 차이

| 프로필 구성 | 지원되는 대표 기능 |
| --- | --- |
| Y L, Party + VH | NAG Killer, Auto Blinker, PedalMap, AP Drive Profile, R79 경로 |
| 일반 3/Y, Body + Chassis | Auto Blinker, PedalMap, AP Drive Profile, R79 경로 |
| 일반 3/Y, Party + Chassis | NAG Killer와 R79 경로. Body CAN이 필요한 PedalMap과 AP Drive Profile은 지원하지 않습니다. |

위 표의 지원 여부는 펌웨어가 해당 경로를 허용한다는 의미입니다. 차량에서 실제 효과가 확인됐다는 뜻은 아닙니다.

## HOME

HOME은 현재 상태를 요약해서 보여줍니다.

| 항목 | 설명 |
| --- | --- |
| AUTOPILOT | 수신한 AP 상태를 `OFF`, `AUTOSTEER`, `NOA`, `FSD` 등으로 표시합니다. `AP STATE UNKNOWN`은 유효한 상태를 받지 못했다는 뜻입니다. |
| TORQUE | 수신한 조향 토크 신호를 표시합니다. 물리적인 조향 명령 표시로 해석하면 안 됩니다. |
| NAG | NAG 기능의 `OFF`, `STANDBY`, `ACTIVE`, `PAUSED` 상태를 표시합니다. |
| BLINKER | Auto Blinker의 `STABILIZATION`, `READY`, `PAUSED`, `EXIT WAIT` 상태를 표시합니다. |
| S3XY | 등록된 S3XY 버튼과 연결 상태를 요약합니다. |
| Quick Controls | Nag Killer, Auto Blinker, TLSSC의 빠른 설정입니다. SETTINGS의 같은 설정과 연결됩니다. |
| Injection State | R79 송신 상태, bit18 정책, TX 성공과 실패를 표시합니다. |
| CAN A, CAN B | 버스 이름, 상태, 수신 여부, 최근 프레임 경과 시간을 표시합니다. `WAITING`은 아직 프레임이 확인되지 않았다는 뜻입니다. |

`R79 TX`가 `WAIT TEMPLATE`이면 사용할 원본 프레임을 기다리는 상태입니다. `DEFAULT ON · MANUAL D/R SUSPEND`는 기본 송신 정책이 허용 상태이지만, D 또는 R에서 수동 운전이 확인되면 R79 송신을 중지한다는 뜻입니다.

## DEVICES

### S3XY 버튼 등록

`+ Add Button`을 누르고 S3XY 버튼을 계속 누른 상태에서 `Continue`를 선택합니다. 검색된 버튼이 하나면 자동으로 연결하고, 여러 개면 대상을 선택합니다. `Connected`가 표시된 뒤 버튼을 놓습니다. 최대 3개까지 등록할 수 있습니다.

### 버튼 동작

| 동작 | 설명 |
| --- | --- |
| Single press | 한 번 눌렀을 때 실행할 동작입니다. |
| Double press | 두 번 눌렀을 때 실행할 동작입니다. |
| Long press | 길게 눌렀을 때 실행할 동작입니다. |
| NOA Lane Change Cancel | 차선 변경 취소 요청입니다. |
| Left Blinker, Right Blinker | 직접 방향지시등 요청입니다. Auto Blinker 타이머와는 별개입니다. |
| Acceleration Mode Toggle | CHILL과 SPORT를 전환합니다. PERFORMANCE 상태에서는 CHILL을 요청합니다. |
| Performance Mode | PERFORMANCE 가속 맵을 요청합니다. 차량의 성능 향상을 보장하지 않습니다. |
| TLSSC Toggle | 일반 TLSSC 설정을 전환합니다. TLSSC Restore와 다릅니다. |
| Auto Blinker Toggle | Auto Blinker 설정을 전환합니다. |
| Research Capture A, B, C, D | LAB의 CAN Research Capture에 상황 라벨을 붙여 기록합니다. |
| Research Capture Reset | 연구 기록을 초기화합니다. |

프로필에서 지원하지 않는 동작은 선택 목록에 나타나지 않습니다. 동작이 등록되어도 AP 상태, 원본 프레임, CAN 복구 상태에 따라 실제 요청이 차단될 수 있습니다.

`Auto Connect`는 버튼별 자동 재연결 설정입니다. `Wireless`의 전역 `S3XY Auto Connect`도 켜져 있어야 자동 재연결이 실행됩니다. `Forget Device`는 등록 정보와 BLE 보안 연결 정보를 삭제합니다.

## SETTINGS

### Nag Killer

NAG 관련 CAN 메시지를 프로필과 AP 상태에 맞춰 처리하는 기능입니다. 코드에 저장된 기본값은 `Enabled ON`, `Mode A`, `Pause at 0 km/h OFF`입니다. 이 기능의 토크 값은 CAN 신호 값이며 실제 조향 동작을 보장하지 않습니다.

| 메뉴 | 설명 |
| --- | --- |
| Enabled | NAG 처리를 켜거나 끕니다. |
| Pause at 0 km/h | 최신 속도가 정확히 0.00 km/h일 때 NAG 송신을 멈춥니다. 기본값은 OFF입니다. |
| Mode A | 토크 표를 순서대로 적용하는 기본 방식입니다. |
| Mode B | 송신 구간과 휴식 구간을 반복합니다. `BURST MS`, `PAUSE MS`가 주기를 정합니다. |
| Mode C | 지정 범위의 토크값을 동적으로 변화시킵니다. |
| Mode H | 대기, 상승, 상호작용, 하강, 휴식 단계를 가진 프로필 방식입니다. 유효 AP와 최신 이동 속도가 필요합니다. |
| Apply | 고급 입력값을 저장하고 적용합니다. |
| Reset Mode A | NAG 전체 설정을 Mode A 기본값으로 되돌립니다. |

Mode H에서는 Rev.1, Rev.3, Rev.4 프로필을 선택할 수 있습니다. Rev.1은 Human Interaction 이벤트, Rev.3은 원본 기준 Natural Grip 보정, Rev.4는 원본과 반대 방향의 carrier와 시각 경고 대응을 사용합니다. `Primary`, `Carrier`, `Refractory`는 각각 주 이벤트, 보정 신호, 이벤트 후 휴식 단계를 뜻합니다.

`Hands-On Policy`의 `ALWAYS HO=1`, `THRESHOLD HO=1`, `TIERED HO=1 / 2`는 HO 값을 만드는 규칙입니다. 이 설정은 차량 카메라가 운전자를 확인하는 기능이 아닙니다. `Visual Warning Rescue`는 Rev.4에서 시각 경고 뒤 지연된 이벤트를 요청하는 실험 설정입니다. `HARD PAUSE · 0-TX`는 정지 시 송신을 멈추고, `STOCK CARRIER`는 원본 토크와 HO를 유지하며 카운터와 체크섬을 진행합니다.

### Auto Blinker

NOA와 ALC 상태가 유효하고 요청 방향이 허용될 때 지연 후 방향지시등을 요청합니다. 기본값은 `Enabled OFF`, 지연 2초, NOA 안정화 10초, 취소 일시정지 20초입니다.

| 메뉴 | 설명 |
| --- | --- |
| Enabled | 자동 방향지시등을 켜거나 끕니다. |
| Door Open Lane Change Cancel | 앞문 열림 입력을 차선 변경 취소로 사용할지 정합니다. 기본값은 OFF입니다. |
| DELAY BEFORE TRIGGER | 요청을 보낸 뒤 방향지시등을 실행하기까지의 지연입니다. 0부터 30초까지 설정할 수 있습니다. |
| NOA Stabilization | NOA 상태가 안정적으로 유지되어야 하는 시간입니다. 1부터 20초까지 설정할 수 있습니다. |
| Cancel Pause | 취소 뒤 자동 요청을 막는 시간입니다. 10부터 100초까지 설정할 수 있습니다. |

안정화 10초와 실행 지연 2초는 서로 다른 타이머입니다. 요청을 준비할 때와 실행할 때 방향별 ALC 조건을 다시 확인합니다. 조건이 사라지면 요청이 취소될 수 있습니다. `EXIT WAIT`는 NOA 이탈을 바로 확정하지 않고 확인하는 상태입니다.

### Summon Monitor

Summon Monitor는 호출 상태와 R79 송신을 관찰하는 화면입니다. 호출을 실행하는 별도 버튼이 아닙니다.

| 메뉴 | 설명 |
| --- | --- |
| R79 bit18, STOCK | SmartSummonOnly 값을 원본대로 유지합니다. |
| R79 bit18, FORCE 0 | SmartSummonOnly 값을 0으로 지정합니다. 기본값입니다. |
| Confirmed gear | 수신으로 확인한 기어 상태입니다. |
| R79 manual latch | D 또는 R에서 수동 운전이 확인된 뒤 R79를 중지하는 상태입니다. |
| TX queue, retry, emergency flush | 송신 대기열과 재시도, 긴급 처리의 상태와 집계입니다. |

v3.7.2의 고정 R79 정책은 bit19를 0으로, bit47을 1로 처리합니다. bit18만 SETTINGS에서 선택합니다. `FORCE 0` 또는 `TX OK`가 차량의 Summon 허용이나 실제 동작을 보장하지는 않습니다.

### TLSSC

Traffic-light와 stop-sign control 관련 플래그를 처리합니다. AP 활성 상태가 필수이며, 신호등을 직접 인식하거나 제동을 보장하는 독립 시스템은 아닙니다.

`Enabled`는 일반 TLSSC 처리를 켜고 끕니다. `Highway / Controlled-Access Gate`는 통제 진입 도로에서 TLSSC를 차단하는 조건이고, `Block TLSSC in NOA`는 NOA 진입 때 TLSSC를 차단하는 조건입니다. 도로 상태는 `0x238` 수신값과 2초 신선도 기준으로 판단합니다.

### Lane Change / ULC

여러 선택값을 최신 CAN B `0x3F8` 원본에 함께 적용합니다.

| 메뉴 | CAN 필드와 의미 |
| --- | --- |
| Confirm-Free Lane Change | `UI_ulcStalkConfirm` bit 1을 0으로 지정합니다. |
| Pre-AP Injection | AP 활성 전에도 Confirm-Free 적용을 허용할지 정합니다. 기본값은 OFF입니다. |
| Off-Highway ALC | `UI_alcOffHighwayEnable` bit 56을 제어합니다. |
| ULC Off-Highway | `UI_ulcOffHighway` bit 15를 STOCK, OFF, ON 중에서 선택합니다. |
| ULC Blind Spot | `UI_ulcBlindSpotConfig` bits 52부터 53까지를 STOCK, STANDARD, AGGRESSIVE, MAD MAX 중에서 선택합니다. |

`Off-Highway ALC`와 `ULC Off-Highway`는 서로 다른 필드입니다. `STOCK`은 원본 유지이고 `OFF`는 선택한 필드를 끄는 값입니다. `TX OK / FAIL`, `RX age`, `Gate-blocked`는 송신 결과와 원본 신선도, 차단 집계입니다.

### PedalMap Control

`0x334` 가속 맵을 현재 주행 세션에만 적용합니다. 선택지는 `STOCK`, `CHILL`, `SPORT`, `PERFORMANCE`입니다. 이 설정은 NVS에 저장하지 않습니다.

선택을 바꾸면 최신 원본 프레임으로 즉시 한 번 송신을 시도하고, 이후 원본 프레임을 따라 반영합니다. 지원 CAN 경로, 최신 원본, 수동 주행, CAN 복구 상태가 필요합니다. P 진입이 확인되거나 T2CAN이 재부팅되면 임시 설정이 해제됩니다. AP Drive Profile이 활성화되면 AP 프로필이 `0x334`를 우선 처리합니다.

### AP Right Scroll

AP가 활성일 때 CAN B의 우측 스크롤 UP과 DOWN을 요청합니다. 기본값은 OFF, 일반 간격 30초, 시각 경고 반복 간격 2초입니다. 일반 간격은 1부터 600초, 시각 경고 반복은 1부터 5초까지 설정합니다.

시각 경고가 새로 감지되면 입력 한 쌍을 요청하고, 경고가 계속되면 반복합니다. AP가 꺼지거나 CAN 복구가 시작되거나 기능을 끄면 자동으로 멈춥니다. 물리적인 스크롤 입력이 우선합니다.

### AP Drive Profile

AUTOSTEER 또는 NOA에서 `0x334` 가속 맵을 CHILL로 적용하고 회생제동 raw 값을 선택합니다.

| 선택 | raw 값 |
| --- | --- |
| STANDARD | 20 |
| REDUCED | 10. 기본 선택값입니다. |
| MINIMAL | 1 |

위 숫자는 CAN 원시값이며 회생제동 퍼센트나 출력 단위가 아닙니다. 해당 프로필이 지원하는 CAN 경로에서만 동작합니다. `AP ownership`은 현재 AP 프로필이 `0x334`를 맡고 있는지 보여줍니다.

### Wireless

`Bluetooth Master`는 Bluetooth 전체 기능을 켜고 끕니다. 버튼 등록, 보안 연결, 동작 배정은 이 스위치를 꺼도 보존됩니다. `S3XY Auto Connect`는 전역 자동 재연결 허용이며, 버튼별 `Auto Connect`와 함께 적용됩니다.

Wi-Fi 설정은 SSID 1부터 32바이트, 새 비밀번호 8부터 63바이트를 사용합니다. 비밀번호를 빈칸으로 두면 기존 비밀번호를 유지합니다. 적용하면 AP만 재시작하며 CAN, BLE, MCU 전체를 재시작하지 않습니다.

`Reset Bluetooth Data`는 모든 S3XY 버튼, 동작 배정, BLE 보안 연결, 검색 캐시를 지웁니다. Bluetooth Master와 전역 Auto Connect 설정은 유지합니다.

### System

`Dashboard Polling Rate`는 브라우저가 HOME 데이터를 읽는 주기입니다. 250ms, 500ms, 1000ms 중 선택하며 기본값은 500ms입니다. CAN 송신 주기를 바꾸지 않고 현재 브라우저의 설정에만 저장합니다.

`Firmware Update`는 Arduino 애플리케이션 `.bin`을 업로드하는 메뉴입니다. 성공하면 T2CAN이 재부팅합니다. 부트로더나 전체 플래시용 `merged.bin`을 애플리케이션 파일로 혼동하면 안 됩니다.

| 메뉴 | 지워지거나 바뀌는 내용 |
| --- | --- |
| Reboot T-2CAN | 보드를 재시작하고 RAM 세션을 초기화합니다. NVS 설정은 남습니다. |
| Reset Firmware Settings | 기능 설정을 기본값으로 되돌리고 재부팅합니다. 차량 프로필, Wi-Fi, S3XY 등록과 BLE 정보는 남습니다. |
| Reset Bluetooth Data | 버튼과 BLE 정보를 지웁니다. 다른 기능 설정은 남습니다. |
| Reset Stats | 런타임 통계와 저장된 BUS OFF 증거를 지웁니다. |
| Factory Reset, Erase All NVS | 차량 프로필과 Wi-Fi, 기능, S3XY, BLE 정보를 모두 지우고 첫 설정 화면으로 돌아갑니다. |

### Diagnostics & CAN Recovery

진단 화면의 `Heap`, `Task stack`, `TWAI queue`는 메모리와 작업 대기열 상태입니다. `CAN A RECOVERY`는 MCP2515의 상태, 오류 플래그, 송신 실패, RX overflow, BUS OFF 복구를 보여줍니다. `CAN B RECOVERY`는 TWAI 상태, heartbeat timeout, BUS OFF, TEC와 REC, 송신 실패, 중재 손실을 보여줍니다.

`Boot Capture CSV`, `CAN A TX CSV`, `CAN B TX CSV`, `BLE CSV`는 진단 자료를 내려받는 기능입니다. `Reset Stats`는 자료를 내려받지 않고 통계를 지웁니다. `Hard Reinitialize`는 CAN 서브시스템을 재초기화하므로 통계 삭제와 다릅니다.

### Banned Car, TLSSC Restore

이 메뉴는 일반 TLSSC와 분리된 위험 기능입니다. 기본값은 OFF입니다. Banned Car를 켜도 TLSSC Restore 송신이 즉시 시작되는 것은 아니며, Restore를 켜는 화면에는 제한된 차량에서만 사용하라는 경고가 표시됩니다. 이 기능을 차량 제한 해제 메뉴로 해석하거나 일반 차량에서 시험하면 안 됩니다.

## LAB

`SETTINGS → LAB Menu`를 켜야 LAB 탭이 표시됩니다. LAB은 읽기 전용 관찰, RX 전용 기록, 실험 송신이 섞여 있으므로 각 항목의 설명을 확인해야 합니다. LAB을 끄면 LAB 전용 송신과 기록은 중단되지만 일부 NVS 저장 선택값은 남습니다.

### R79 Status

읽기 전용 상태 화면입니다. `Fixed R79 Policy`, `MUX1 RX / TX OK / FAIL`, `Fast attempts`, `Periodic`, `Quiet arm / fire / guard`는 고정된 R79 처리와 그 결과를 보여줍니다. 설정 변경은 `Summon Monitor`에서 합니다.

### Disable Driver Monitoring (NAG)

이 실험은 `0x3FD mux1 bit43`을 0으로 지정하는 경로입니다. 이름만으로 카메라 기반 운전자 감시 전체가 비활성화됐다고 판단하면 안 됩니다. 기본값은 OFF이고 선택값은 NVS에 저장됩니다. LAB을 꺼도 저장 선택은 남지만, LAB 전용 적용은 중단됩니다. 차량 세대와 소프트웨어에 따른 효과는 별도 검증이 필요합니다.

### Blinker TX Comparison

방향지시등 전송 방식을 비교하는 임시 설정입니다. 프로필 기본값은 Y L에서 `SINGLE TX`, 다른 지원 3/Y에서 `LEGACY 350ms BURST`입니다. LAB에서 바꾼 값은 RAM에만 남고 LAB을 끄거나 재부팅하면 프로필 기본값으로 돌아갑니다.

### Auto Lane Change Enable

`0x293 UI_autoLaneChangeEnable` bits 24부터 25까지를 raw 1로 지정하는 실험입니다. SETTINGS의 `0x3F8` Lane Change / ULC 설정과 별도 경로입니다. CAN A, CAN B, BOTH 중 대상 버스를 선택할 수 있으며 AP 활성 조건과 원본 프레임 조건이 적용됩니다.

### Blind Spot Injection Monitor

읽기 전용 화면입니다. 설정은 `SETTINGS → Lane Change / ULC`에서 바꿉니다. `Stock RX`는 원본, `Last TX`는 공통 compositor가 마지막으로 제출한 값, `Blind changed`는 필드 변경 여부입니다. 마지막 제출값이 차량의 실제 채택 결과라는 뜻은 아닙니다.

### CAN Research Capture

CAN A와 CAN B의 수신 프레임을 기록하는 RX 전용 연구 도구입니다. 캡처 기록기는 CAN을 재생하거나 송신하지 않습니다.

| 모드 | 설명 |
| --- | --- |
| SNAPSHOT | 트리거 전후 상태 묶음을 기록합니다. PRE는 2, 5, 10, 15초, POST는 2, 5, 10초를 선택합니다. |
| RAW TRANSITION | 실제 RX 프레임을 기록합니다. 수동 RAW는 PRE 최대 5초와 POST 2초를 사용합니다. |
| AUTO ALC TRANSITION | ALC 상태 6과 8을 LEFT OPEN, 다른 유효 상태를 LEFT BLOCKED로 분류해 자동 기록합니다. 자동 PRE는 2초, POST는 2초입니다. |
| ULC / CONFIRM-FREE | 지정된 ULC 관련 ID만 기록합니다. PRE 3초, POST 7초가 고정입니다. |

대상 ID는 모드에 따라 달라집니다. ULC 모드에서는 `0x247`, `0x3F8`, `0x3E9`, `0x24A`, `0x3FD`, `0x293`을 두 버스에서 기록합니다. `LABEL A`부터 `LABEL D`는 상황 이름을 저장하고, `Download Research CSV`는 기록을 내려받습니다. 캡처 기록은 전원 차단 뒤에도 남는 영구 자료라고 가정하지 말고 필요한 CSV를 먼저 내려받습니다.

### Driver Monitoring Capture

모든 차량 프로필에서 두 CAN 버스의 `0x389`, `0x5D9`, `0x247`, `0x399`, `0x370`을 관찰하는 RX 전용 도구입니다. PRE 2초와 POST 5초를 사용하고, 실제 보관 한도는 12구간과 2,048표본입니다.

| 라벨 | 화면 의미 |
| --- | --- |
| A | FRONT, NORMAL. 정상 전방 주시 상황입니다. |
| B | SCREEN GLANCE. 화면을 잠깐 본 상황입니다. |
| C | SIDE LOOK. 옆을 본 상황입니다. |
| D | LOOK DOWN. 아래를 본 상황입니다. |
| E | TORQUE + LOOK AWAY. 조향 토크와 다른 방향 주시가 함께 있는 상황입니다. |
| F | FRONT, NO TORQUE. 전방을 보면서 의도적인 조향 토크가 없는 상황입니다. |

각 ID의 `raw` 값과 CAN A/B 기록이 근거 자료입니다. 화면의 `DRIVER INTERACTION`, `DAS hands-on`, `EPAS hands-on`은 연구용 해석값이므로 차량의 카메라 판단을 확정하는 값으로 사용하면 안 됩니다. `Download Driver Monitoring CSV`로 내려받고, `Reset Driver Monitoring Capture`로 현재 기록을 지웁니다.

## 자주 헷갈리는 부분

- 메뉴가 안 보이면 차량 프로필과 CAN 배선 지원 여부, LAB Menu 상태를 먼저 확인합니다.
- 기능이 ON이어도 TX가 0이면 AP 조건, 원본 프레임의 신선도, Gate, CAN 복구 상태를 확인합니다.
- PedalMap은 P 진입이나 재부팅 때 해제되는 RAM 세션입니다.
- AP Drive Profile이 활성화되면 `0x334` 출력은 AP 프로필이 우선합니다.
- LAB을 꺼도 SETTINGS의 ULC 저장 설정이 모두 지워지는 것은 아닙니다.
- NAG 설정 초기화 뒤 Enabled가 ON이 될 수 있습니다. 코드 기본값이 ON, Mode A이기 때문입니다.
- Wi-Fi 설정을 바꾸면 AP가 재시작되어 휴대전화가 새 SSID에 다시 연결해야 할 수 있습니다.

이 글은 T2CAN Universal v3.7.2의 메뉴와 설정 동작을 설명하는 문서입니다. 실제 차량의 안전 기능, Tesla 서버의 제한 상태, 운전자 감시 해제, 차선 변경 결과를 보증하는 문서가 아닙니다.
