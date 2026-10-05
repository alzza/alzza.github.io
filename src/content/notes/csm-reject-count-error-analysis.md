---
title: "CSM Reject 적산오류 분석 · Rev.2"
date: "2026-10-05"
excerpt: "탈취 완료 후 Blank를 빠르게 Reject할 때 생산 적산이 두 번 증가한다. 두 로봇 경로, PLC 카운트 조건, 출근 후 수집할 8개 Trend와 판독 순서를 정리했다."
kicker: 현장 진단
tags: ["CSM", "PLC", "Robot2", "Reject", "Trend"]
---

Rev.2 · 2026-10-05 · 원본 RLL 5개에 L5X Ladder Studio LD를 추가했다. 현장 Trend 수집 전 분석이다. PLC와 로봇 프로그램은 변경하지 않는다.

LD는 기존 L5X Ladder Studio 렌더러로 표시한다. 각 그림은 바로 위 원본 RLL과 같은 렁이다. ST로 작성된 표시값 복사·초기화는 ST 원문으로 유지한다.

## 출근하면 먼저 할 일

1. HMI의 문제 수량이 `Prod_Tracking`의 `ui_o_reject_cathodes`와 연결됐는지 확인한다. 로봇 랙 매수와 구분한다.
2. 아래 **Trend A의 8개 태그만 먼저 설정**한다. 현재 `Robot2.tm_RejectWait.PRE` 값도 읽어서 기록한다. 분석한 값은 15000ms다.
3. 정상 조업 중 빠른 Blank Reject가 발생할 때 버튼 전부터 배출 후까지 기록한다. 비교할 느린 미탈취 Reject는 승인된 정상 작업 기회가 있을 때 기록한다. 재현을 위해 강제로 실패시키거나 동작 중 접근하지 않는다.
4. 원본 CSV, HMI 수량 변화, SM 번호, 운전 모드, 버튼을 누른 시점과 당시 실행 중이던 로봇 프로그램을 함께 남긴다.
5. 첫 로그를 확보하기 전에는 타이머·로봇 속도·I/O 매핑·카운트 렁을 바꾸지 않는다. 한꺼번에 바꾸면 원인을 구분할 수 없다.

## 1. 조업자가 설명한 증상

SM#1 또는 SM#2에서 전기동 탈취가 끝난 뒤 Robot#2가 Blank Cathode를 집어 이동할 때 판넬 Reject 버튼을 누른다. 생산 Reject 적산이 버튼을 누를 때 한 번 증가하고, Reject Rack에 놓으며 그리퍼를 여는 시점 부근에서 다시 한 번 증가한다. Manual과 Auto에서 모두 관찰했다고 한다.

추가로 확인한 현장 설명은 **전기동을 제거한 가벼운 Blank를 빠르게 Reject하는 첫 번째 경로에서만 발생한다**는 것이다. 전기동이 붙은 채 저속으로 집어 올리는 두 번째 경로에서는 발생하지 않는다고 한다. 아직 같은 조건의 Trend로 비교한 결과는 아니다.

요구사항은 유효한 Reject 버튼 조작 한 번에 생산 수량을 한 번 적산하고, Production Reset 전까지 유지하는 것이다. 이번 노트는 이 요구사항과 현재 동작의 차이를 진단한다. 최종 수정안은 로그를 본 뒤 정한다.

## 2. 로봇에는 서로 다른 Reject 경로가 있다

제공된 메인 프로그램의 이름은 `RSR0001`이다. 아래 행 번호는 로봇 프로그램 내부 번호다.

### 탈취 완료 후 Blank를 빠르게 Reject하는 경로

`RSR0001`에서 `UNLOAD_1` 또는 `UNLOAD_2`를 호출한다. 일반 집기 경로에서 `CLOSE`를 실행한 뒤 메인으로 돌아온다. 메인 61행에서 `DI[6]`을 확인해 `REJECT1`을 호출하고, 그 안에서 `OPEN`을 실행한다.

`DI[6]` 주석은 `DIE_IN_PERMIT`이지만 이 코드에서는 Reject 선택에 사용된다. 주석만으로 신호 역할을 판단하지 않는다. 현장 설명과 코드 구조를 맞추면 이번 조사 대상은 이 경로다. 실제 발생 때 프로그램 이름도 기록해 확인한다.

### 전기동 미탈취 상태로 저속 Reject하는 경로

`UNLOAD_1` 17행 또는 `UNLOAD_2` 14행에서 이미 `DI[6]`이 켜져 있으면 별도 집기 경로로 분기한다. `CLOSEREJ`로 잡고 낮은 속도로 인출한 뒤, 각각 57행 또는 51행에서 `REJECT`를 호출한다. 일반 집기와 접근 위치·속도가 다르다.

느린 경로가 정상이라는 관찰만으로 타이머 가설을 배제할 수는 없다. PLC의 요청 생성·해제 경로도 다르기 때문이다. 반대로 빠른 경로라는 이유만으로 15초 만료가 발생한다고 단정해서도 안 된다.

### 두 배출 프로그램의 공통 출력 순서

`REJECT`와 `REJECT1`은 위치와 속도가 다르지만 다음 부분은 같다.

1. 11행에서 `DO[6]=OFF`를 실행한다.
2. 17행에서 `REJ_INDX`를 호출해 랙 위치를 계산한다.
3. 22행에서 `OPEN`을 호출한다.
4. 24행에서 로봇 내부 랙 위치용 `R[15]`를 증가시킨다. 생산 적산과는 다른 값이다.
5. 37행의 후퇴 이동 뒤, 38행에서 `DO[16]`을 1초 펄스로 켠다.
6. 39행에서 `DO[6]=ON`을 실행한다.

`OPEN`은 Open 확인 후 `DO[8]`을 끄고 `DO[7]`을 켠다. 생산 적산을 직접 증가시키지는 않는다. 완료 펄스와 Clear 복귀로 보이는 `DO[16]`, `DO[6]` 사이에는 별도 WAIT 명령이 없다. 실제 PLC 수신 비트와의 대응 및 수신 순서는 현장 I/O 화면과 Trend로 확인한다.

### 버튼을 누른 정확한 위치도 중요하다

메인 57행은 `DI[1]`이 켜지면 `LOAD_OUT`을 먼저 호출한다. 제공된 `LOAD_OUT`의 정상 실행 경로에는 `DI[6]`을 다시 확인해 Reject로 전환하는 분기가 없다. 따라서 “Outfeed 쪽으로 이동 중”이 아직 `UNLOAD_1/2` 실행 중인지, 이미 `LOAD_OUT` 내부인지 구분한다. 이미 `LOAD_OUT`에 들어간 뒤에도 실제로 Reject로 전환한다면 현장 프로그램이나 다른 실행 경로가 제공본과 다른지 확인한다.

## 3. 생산 적산과 로봇 랙 카운트를 구분한다

- `Prod_Tracking.reject_increment`: 생산 Reject 누적값이다.
- `Prod_Tracking.ui_o_reject_cathodes`: 위 누적값을 복사한 표시용 값이다. 실제 HMI 연결은 확인이 필요하다.
- `Robot2.z_R2_Reject_Count`: 랙 배출 완료 입력으로 증가하고 랙 비우기 명령으로 초기화하는 별도 값이다.
- `Cathode_Tracking`의 `Sheet_O` 집계도 별도다. 이번 생산 적산과 혼동하지 않는다.

생산 수량을 쓰는 곳은 `Prod_Tracking → Background → Rung 1`이다. 아래는 원본이다. 수정 입력용 코드가 아니다.

```text
XIC(z_signal_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);
```

<figure class="ld-rung" data-rung="1" data-rll="XIC(z_signal_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);">
<div class="rung-meta"><span class="rung-meta-number">Prod_Tracking / Background 원본 Rung 1</span><span class="rung-meta-description">Reject 적산 신호의 상승을 한 번 검출해 생산 누적값을 1 증가시킨다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/ld_rung_00.svg" alt="Prod_Tracking Background 원본 Rung 1 LD" width="1040">
</figure>

`Prod_Tracking → Background2 → ST 62행`은 표시값을 복사한다.

```text
ui_o_reject_cathodes := reject_increment;
```

`Prod_Tracking → Reset → ST 29행`은 생산 적산을 초기화한다. `MainRoutine` Rung 0의 `ui_i_prod_reset` 경로에서 이 Routine을 호출한다.

```text
reject_increment := 0;
```

## 4. 버튼부터 적산까지 PLC에서 일어나는 일

### 버튼을 요청으로 기억한다

`Operator_Console → Background → Rung 21`에서 판넬 버튼 `i_reject` 또는 HMI 요청 `ui_i_R2_reject`로 두 비트를 래치한다. 판넬 버튼 주소는 `N20:0:I.6`이다. 이 렁에는 버튼 상승만 검출하는 ONS가 없다.

```text
[XIC(i_reject) ,XIC(ui_i_R2_reject) ][OTL(z_i_reject) ,OTL(z_i_reject_rb2) ];
```

<figure class="ld-rung" data-rung="21" data-rll="[XIC(i_reject) ,XIC(ui_i_R2_reject) ][OTL(z_i_reject) ,OTL(z_i_reject_rb2) ];">
<div class="rung-meta"><span class="rung-meta-number">Operator_Console / Background 원본 Rung 21</span><span class="rung-meta-description">판넬 또는 HMI Reject 요청을 두 요청 비트에 기억한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/ld_rung_01.svg" alt="Operator_Console Background 원본 Rung 21 LD" width="1040">
</figure>

### 요청으로 Reject 이동 명령을 만든다

`Robot2 → Background → Rung 24`는 여러 Reject 요청을 합쳐 `o_load_reject`를 만든다. 판넬 요청 경로만 보면 `z_i_reject_rb2=1`, `i_reject_rack_full=0`, `i_clear_of_reject=1`일 때 명령이 성립한다. 이 경로에는 Auto/Manual 또는 Gripper Closed 접점이 없다. 아래는 다른 요청 경로까지 포함한 원본 전체다.

```text
[XIC(signal_man_load_reject) ,XIC(signal_man_load_reject2) ,XIC(z_i_reject_rb2) ,AFI() [XIC(z_permit_sm1_r2_auto_reject_load) XIO(signal_man_load_reject) ,XIC(z_permit_sm2_r2_auto_reject_load) XIO(signal_man_load_reject) ] XIC(i_gripper_open) ][XIO(f_rb2_set_outfeed) ,XIC(z_i_reject_rb2) ]XIO(i_reject_rack_full)XIC(i_clear_of_reject)OTE(o_load_reject);
```

<figure class="ld-rung" data-rung="24" data-rll="[XIC(signal_man_load_reject) ,XIC(signal_man_load_reject2) ,XIC(z_i_reject_rb2) ,AFI() [XIC(z_permit_sm1_r2_auto_reject_load) XIO(signal_man_load_reject) ,XIC(z_permit_sm2_r2_auto_reject_load) XIO(signal_man_load_reject) ] XIC(i_gripper_open) ][XIO(f_rb2_set_outfeed) ,XIC(z_i_reject_rb2) ]XIO(i_reject_rack_full)XIC(i_clear_of_reject)OTE(o_load_reject);">
<div class="rung-meta"><span class="rung-meta-number">Robot2 / Background 원본 Rung 24</span><span class="rung-meta-description">Reject 요청과 랙 Full·Clear 조건으로 로봇 Reject 이동 명령을 만든다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/ld_rung_02.svg" alt="Robot2 Background 원본 Rung 24 LD" width="1040">
</figure>

### 이동 명령을 15초 OFF-delay로 유지한다

바로 다음 `Robot2 → Background → Rung 25`가 생산 적산 신호를 만든다.

```text
[XIC(o_load_reject) TOF(tm_RejectWait,?,?) ,XIC(tm_RejectWait.DN) OTE(z_signal_reject_loaded) ];
```

<figure class="ld-rung" data-rung="25" data-rll="[XIC(o_load_reject) TOF(tm_RejectWait,?,?) ,XIC(tm_RejectWait.DN) OTE(z_signal_reject_loaded) ];">
<div class="rung-meta"><span class="rung-meta-number">Robot2 / Background 원본 Rung 25</span><span class="rung-meta-description">Reject 명령이 꺼져도 TOF의 DN이 유지되는 동안 생산 적산 신호를 유지한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/ld_rung_03.svg" alt="Robot2 Background 원본 Rung 25 LD" width="1040">
</figure>

분석한 `tm_RejectWait.PRE`는 15000ms다. 원문 `?`는 내보내기의 타이머 피연산자 표기이며 PRE가 없다는 뜻이 아니다. TOF는 명령이 켜지면 DN도 즉시 켜지고, 명령이 꺼진 뒤 15초가 지나야 DN이 꺼진다. “버튼을 누르고 15초 뒤에 적산”하는 구조가 아니다. 그래서 버튼 직후 먼저 +1이 될 수 있다.

### 완료를 보고 요청을 해제한다

`Robot2 → Background → Rung 48`은 `i_reject_loaded` 또는 SM별 완료·Clear 조합, Home 요청으로 `z_i_reject_rb2` 등을 해제한다. **명령을 만드는 Rung 24와 타이머 Rung 25보다 뒤에서 실행된다.**

```text
[XIC(i_reject_loaded) ,XIC(f_reject_st1_done) XIC(i_clear_of_station_1) ,XIC(f_reject_st2_done) XIC(i_clear_of_station_2) ,XIC(z_ui_i_home_all) ][OTE(z_signal_r2_sm1_reject_complete) ,OTE(z_signal_r2_sm2_reject_complete) ,[XIC(f_reject_st1_done) ,XIC(z_ui_i_home_all) ] OTU(z_signal_rejecting_sm1) ,[XIC(f_reject_st2_done) ,XIC(z_ui_i_home_all) ] OTU(z_signal_rejecting_sm2) ,OTU(z_i_reject_rb2) ,OTU(z_i_reject) ,OTU(f_reject_st1_done) ,OTU(f_reject_st2_done) ];
```

<figure class="ld-rung" data-rung="48" data-rll="[XIC(i_reject_loaded) ,XIC(f_reject_st1_done) XIC(i_clear_of_station_1) ,XIC(f_reject_st2_done) XIC(i_clear_of_station_2) ,XIC(z_ui_i_home_all) ][OTE(z_signal_r2_sm1_reject_complete) ,OTE(z_signal_r2_sm2_reject_complete) ,[XIC(f_reject_st1_done) ,XIC(z_ui_i_home_all) ] OTU(z_signal_rejecting_sm1) ,[XIC(f_reject_st2_done) ,XIC(z_ui_i_home_all) ] OTU(z_signal_rejecting_sm2) ,OTU(z_i_reject_rb2) ,OTU(z_i_reject) ,OTU(f_reject_st1_done) ,OTU(f_reject_st2_done) ];">
<div class="rung-meta"><span class="rung-meta-number">Robot2 / Background 원본 Rung 48</span><span class="rung-meta-description">배출 완료 또는 Home 요청으로 Reject 요청을 해제하고 완료 신호를 만든다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/ld_rung_04.svg" alt="Robot2 Background 원본 Rung 48 LD" width="1040">
</figure>

50ms 주기 Task 안에서는 `Operator_Console`, `Prod_Tracking`, `Robot2` 순으로 실행된다. 생산 적산은 통상 이전 Robot2 실행에서 만든 신호를 다음 실행에 읽는다. 입력 갱신은 별도로 일어날 수 있으므로, 이 순서만으로 외부 신호의 실제 도착 순서를 단정하지 않는다.

## 5. 중복될 수 있는 조건과 반증 기준

가설 A는 다음 조건이 모두 겹치는 경우다.

1. 버튼으로 첫 Reject 명령이 켜져 생산 적산이 +1 된다.
2. 명령이 꺼진 채 PRE 이상 경과해 `z_signal_reject_loaded`가 0이 된다. 생산 적산 렁도 그 0을 읽어 ONS가 다시 준비된다.
3. Reject 요청이 남아 있는 동안 Clear가 복귀해 Rung 24의 명령이 다시 켜진다.
4. 타이머 DN과 적산 신호가 다시 켜져 두 번째 +1이 발생한다.

완료와 Clear가 같은 Robot2 실행에 들어오면 Rung 48이 요청을 해제하기 전에 Rung 24가 남아 있던 요청으로 명령을 만들 수 있다. 완료가 앞선 실행에서 처리되어 요청이 이미 꺼졌다면 이 경로는 성립하지 않는다. 버튼이 계속 눌려 있으면 해제 뒤 요청이 재설정되는 경우도 확인한다.

**빠른 Blank 경로의 명령 OFF 구간이 15초 미만이고, 실제 PRE도 15000이며, 별도 신호 쓰기가 없다면 가설 A만으로 두 번 증가를 설명할 수 없다.** 전체 이동 시간이나 버튼부터 Open까지의 시간이 아니라 `o_load_reject`가 연속해서 0이었던 구간을 잰다. 느린 집기 동작 전체를 15초 구간으로 계산하지 않는다.

가설 B는 생산 적산 신호 또는 카운터가 현장 코드·HMI 등 다른 곳에서 다시 쓰이는 경우다. 가설 C는 HMI가 다른 카운터나 합산식을 표시하는 경우다. 가설 D는 로봇 교체로 완료/Clear 매핑·출력 순서가 바뀐 경우다. 아직 어느 가설도 현장 원인으로 확정하지 않았다.

## 6. 오프라인에서 확인한 범위

6월과 9월의 CATHODE 1 PLC 제공본을 비교했을 때 버튼 렁, Robot2 Background 24·25·47·48, 생산 적산 렁과 PRE=15000은 같았다. 현재 Online 값까지 같다는 뜻은 아니다. 두 로봇 배출 프로그램은 신호 순서가 같고 속도·위치가 달랐다.

앞선 분석에서 판넬 요청 경로만 남긴 50ms 스캔 모델로 아래 여섯 조건을 시험했다. 다른 Reject 요청은 0, 랙 Full은 0으로 두었다. 물리 로봇, 통신 지연, 전체 SFC를 에뮬레이션한 결과가 아니라 중복 가능성을 확인하는 제한된 논리 모의시험이다.

- 명령 OFF 10초 뒤 완료와 Clear가 동시에 들어오면 1회였다.
- 명령 OFF 16초 뒤 완료와 Clear가 동시에 들어오면 2회였다.
- OFF 16초 뒤 완료를 Clear보다 한 실행 먼저 처리하면 1회였다.
- OFF 16초 뒤 Clear가 완료보다 먼저 복귀하면 2회였다.
- Clear가 계속 켜져 명령이 끊기지 않으면 1회였다.
- 버튼을 계속 눌러 요청이 재설정되고 15초 이후 Clear가 복귀하면 2회였다.

## 7. Trend A: 우선 이 8개만 수집한다

전부 **CATHODE 1 PLC**에서 수집한다. Robot#2에 로그 저장 기능이 없어도 PLC가 받은 신호를 기록할 수 있다. Program 태그는 태그 선택기에서 해당 Program을 고른다. 아래 `Program:` 표기는 Scope를 구분한 이름이며, 수집 도구가 다른 표기를 쓰면 같은 태그를 선택한다. BOOL은 디지털, TIMER.ACC와 DINT는 아날로그로 설정한다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="Trend A 태그 8개, 좌우 스크롤 가능">
<table><thead><tr><th>펜</th><th>태그</th><th>구분</th><th>확인할 내용</th></tr></thead><tbody>
<tr><td>1</td><td><code>Program:Operator_Console.i_reject</code></td><td>디지털</td><td>실제 버튼 누름과 유지 시간을 확인한다.</td></tr>
<tr><td>2</td><td><code>z_i_reject_rb2</code></td><td>디지털</td><td>요청의 유지·해제 시점을 확인한다.</td></tr>
<tr><td>3</td><td><code>Program:Robot2.i_clear_of_reject</code></td><td>디지털</td><td>Clear가 꺼졌다 복귀하는 시점을 확인한다.</td></tr>
<tr><td>4</td><td><code>Program:Robot2.o_load_reject</code></td><td>디지털</td><td>명령이 한 장에 두 번 켜지는지 확인한다.</td></tr>
<tr><td>5</td><td><code>Program:Robot2.tm_RejectWait.ACC</code></td><td>아날로그</td><td>OFF-delay가 PRE에 도달하는지 확인한다.</td></tr>
<tr><td>6</td><td><code>z_signal_reject_loaded</code></td><td>디지털</td><td>생산 적산 입력의 재상승을 확인한다.</td></tr>
<tr><td>7</td><td><code>Program:Robot2.i_reject_loaded</code></td><td>디지털</td><td>완료 신호와 Clear의 순서를 비교한다.</td></tr>
<tr><td>8</td><td><code>Program:Prod_Tracking.reject_increment</code></td><td>아날로그</td><td>실제 +1 시각과 한 장의 증가량을 확인한다.</td></tr>
</tbody></table>
</div>

### 수집 설정과 시험 순서

가능한 수집 주기는 20ms에서 50ms 사이로 설정하되 현장 도구의 지원 범위와 부하를 확인한다. 50ms 주기 PLC라도 Trend의 샘플 위상과 통신 때문에 한 실행짜리 펄스를 놓칠 수 있다. 100ms 이상의 느린 로그에서 신호가 보이지 않는다고 발생하지 않았다고 판단하지 않는다.

버튼 누르기 5초에서 10초 전부터 기록하고 배출·Clear 복귀 뒤 20초 이상 유지한다. 한 기록에 40초에서 60초 정도를 확보하며, 실제 작업이 길면 전체 동작이 들어가도록 늘린다. 생산 수량을 0으로 만들 필요는 없다. 시작값과 종료값의 차이를 본다. 기록 중 Production Reset은 누르지 않는다.

우선 증상이 있는 빠른 Blank Reject 한 건을 확보한다. 여유가 있으면 같은 경로에서 중복되지 않은 건과 느린 미탈취 Reject 한 건을 같은 Trend 설정으로 비교한다. SM#1/SM#2 및 Auto/Manual은 사건 기록에 적는다. 모든 조합을 억지로 만들기 위해 조업 조건을 바꾸지 않는다.

빠른 경로의 원인을 찾는 데 느린 경로 로그가 반드시 필요한 것은 아니다. 시간이 부족하면 **중복된 빠른 경로 한 건의 Trend A**를 먼저 확보한다.

## 8. Trend B: 첫 로그로 부족할 때만 추가한다

두 번째 창도 최대 8개다. A만으로 명령 재발생이 확인되면 B를 무조건 수집할 필요는 없다. B는 Gripper Open·일반 집기 상태와 별도 Reject 요청이 겹치는지 확인한다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="Trend B 태그 8개, 좌우 스크롤 가능">
<table><thead><tr><th>펜</th><th>태그</th><th>구분</th><th>확인할 내용</th></tr></thead><tbody>
<tr><td>1</td><td><code>Program:Robot2.i_gripper_open</code></td><td>디지털</td><td>Open과 두 번째 증가 시점을 비교한다.</td></tr>
<tr><td>2</td><td><code>Program:Robot2.f_rb2_set_outfeed</code></td><td>디지털</td><td>일반 Outfeed 선택 상태를 확인한다.</td></tr>
<tr><td>3</td><td><code>Program:Robot2.signal_man_load_reject</code></td><td>디지털</td><td>SM#1 별도 요청이 겹치는지 확인한다.</td></tr>
<tr><td>4</td><td><code>Program:Robot2.signal_man_load_reject2</code></td><td>디지털</td><td>SM#2 별도 요청이 겹치는지 확인한다.</td></tr>
<tr><td>5</td><td><code>Program:Robot2.o_load_reject</code></td><td>디지털</td><td>명령 재발생을 확인한다.</td></tr>
<tr><td>6</td><td><code>z_signal_reject_loaded</code></td><td>디지털</td><td>생산 적산 입력을 확인한다.</td></tr>
<tr><td>7</td><td><code>Program:Prod_Tracking.reject_incr_ons</code></td><td>디지털</td><td>ONS 기억값이 다시 0이 되는지 확인한다.</td></tr>
<tr><td>8</td><td><code>Program:Prod_Tracking.reject_increment</code></td><td>아날로그</td><td>실제 수량 증가를 확인한다.</td></tr>
</tbody></table>
</div>

A와 B를 따로 기록하면 서로 다른 사건이다. 파일마다 사건 번호를 붙이고 다른 사건의 신호를 같은 시간축에 합쳐 원인을 단정하지 않는다. HMI 수량만 두 번 바뀌고 PLC 누적은 한 번이라면 B보다 먼저 실제 HMI 연결 태그와 표시식을 확인한다.

## 9. 로그를 읽는 순서

1. `reject_increment`에서 첫 번째와 두 번째 +1 시각을 찾는다.
2. 그 직전의 `z_signal_reject_loaded`가 각각 0→1인지 본다. 샘플 누락 가능성을 함께 판단한다.
3. 두 상승 사이에 `o_load_reject=0`이 얼마나 지속됐는지, ACC가 실제 PRE까지 갔는지 확인한다.
4. 두 번째 명령 때 `z_i_reject_rb2`가 남아 있었는지, Clear와 완료가 어떤 순서로 들어왔는지 확인한다. 렁 실행 중 잠깐 사용된 요청값은 스캔 뒤 Trend에서 이미 0일 수 있으므로 끝값 하나만으로 가설을 배제하지 않는다.
5. 버튼이 계속 1이거나 두 번 들어왔다면 요청 재설정 경로를 확인한다. 짧은 버튼 바운스만으로 항상 두 번 적산되는 것은 아니다. 뒤의 타이머 신호도 다시 상승해야 한다.
6. 적산 신호 재상승이 없는데 PLC 누적이 두 번 증가했다면 샘플 간격을 먼저 확인하고, 현재 PLC의 해당 태그 Cross Reference 및 외부 쓰기를 조사한다.

**가설 A를 지지하는 로그:** 명령 OFF → PRE 도달 및 적산 신호 OFF → Clear 복귀 부근 명령 재상승 → 적산 신호 재상승 → 두 번째 +1이 이어진다.

**가설 A로 설명하지 못하는 로그:** 충분한 해상도에서 명령 OFF가 PRE보다 짧고 적산 신호가 계속 1인데 실제 PLC 누적값은 두 번 증가한다. 이 경우 타이머를 늘리지 말고 다른 쓰기 경로·현장 프로그램 차이·표시값을 조사한다.

**주의:** 이 타이머는 중복을 만들 가능성뿐 아니라, 서로 다른 두 요청이 DN 유지 시간 안에 들어오면 하나로 합쳐 셀 가능성도 있다. PRE를 늘리는 조치만으로 “버튼 한 번당 한 번”이 보장되지는 않는다.

## 10. 회사에서 함께 확인할 화면과 제출 자료

- HMI 문제 수량의 태그 연결 또는 표시식 화면을 확보한다.
- `Robot2 / Background` Rung 24·25·48과 `Prod_Tracking / Background` Rung 1의 현재 Online 내용을 확인한다. 분석한 위치와 번호가 다르면 태그·로직으로 찾는다.
- `tm_RejectWait.PRE`, PLC Task 주기, Trend 실제 수집 간격을 기록한다. 값은 읽기만 한다.
- Robot#2 I/O 설정에서 `DO[6]`, `DO[16]`, `DO[7]`이 각각 어떤 PLC 입력으로 들어가는지 확인한다. 분석본의 PLC Alias는 Clear=`ROBOT2:I1.Input[3].1`, 완료=`ROBOT2:I1.Input[4].3`, Open=`ROBOT2:I1.Input[3].2`다. 로봇 DO 번호와의 실제 매핑은 별도 대조한다.
- 현재 메인과 `UNLOAD_1`, `UNLOAD_2`, `REJECT`, `REJECT1`, `OPEN`, `LOAD_OUT`이 제공본과 같은지 확인한다. 로봇 로그를 저장하라는 요구가 아니다. 프로그램 백업 또는 해당 행·I/O 화면이면 된다.
- Trend는 그래프 사진뿐 아니라 시간과 값이 있는 CSV 원본, 펜 이름, 수집 간격을 함께 전달한다. 원본 CSV는 공개 댓글이 아니라 분석용으로 전달한다.

다음 양식을 사건마다 한 번 작성한다.

```text
사건 번호 / 발생 일시:
SM#1 또는 SM#2:
Auto 또는 Manual:
빠른 Blank Reject / 느린 미탈취 Reject:
버튼 종류: 판넬 / HMI
버튼 누른 횟수와 누른 시간:
버튼 당시 로봇 프로그램·행 번호(확인 가능한 경우):
생산 적산 시작값 → 첫 증가값 → 최종값:
실제 랙에 놓은 장수:
중간 정지·Hold·알람·재시작 유무:
로봇 속도 Override(%):
tm_RejectWait.PRE:
Trend 실제 주기 / 파일 이름:
Production Reset 실행 유무:
```

로그 확보 뒤 먼저 PLC 누적 자체의 중복인지 판별하고, 그다음 명령 재발생 조건을 확정한다. 이후 버튼 접수 기준으로 셀지, 실제 배출 완료 기준으로 셀지와 유효 요청 범위를 정해 수정 전후 로직을 작성한다. 이번 노트에는 적용할 변경 로직이 없으며, 원인 확인 전에 카운트 렁을 교체하지 않는다.

## 참고한 공식 동작 정의

- [Rockwell ONS](https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/bit-instructions1/one-shot--ons-1.html): 앞 조건의 false→true마다 한 번 실행하며, false일 때 기억값을 해제한다.
- [Rockwell TOF](https://www.rockwellautomation.com/en-ua/docs/factorytalk-design-studio/current/contents-ditamap/instructions/instruction-set/timer-and-counter-instructions/timer-off-delay--tof-.html): 명령이 참이면 DN을 설정하고, 명령이 거짓이 된 뒤 설정 시간만큼 유지한다.

프로그램에서 확인된 경로, 조업자의 관찰, 조건부 모의시험을 구분해 기록했다. **빠른 Blank 경로만 두 번 증가하는 실제 원인은 아직 미확정이며, 다음 조업의 Trend로 판별한다.**
