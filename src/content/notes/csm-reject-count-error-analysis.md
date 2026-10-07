---
title: "CSM Reject 적산오류 분석 · Rev.4"
date: "2026-10-07"
excerpt: "랙 카운터는 +1인데 생산 리젝트 적산만 간헐적으로 +2 되는 증상을 정리했다. 완료 입력으로 접점 하나를 교체하는 최소 수정안과 변경 전후 LD, 적용·시험·복구 절차를 제공한다."
kicker: PLC 변경안
tags: ["CSM", "PLC", "Robot2", "Reject", "Trend"]
---

**Rev.4 · 2026-10-07.** 현장에서 **한 장을 Reject할 때 랙 카운터는 정상적으로 +1이고, 생산 리젝트 적산만 가끔 +2가 된다**는 추가 확인을 반영했다. 이번 개정은 생산 적산의 입력 접점 하나를 배출 완료 입력으로 바꾸는 안이다. 이전 Rev.3의 작업 시작 감지용 여러 렁 추가안은 이번 적용안에서 제외한다.

> 적용 범위는 **Prod_Tracking 로컬 Alias 태그 1개 추가, Background 원본 Rung 1의 첫 접점 1개 교체**다. 버튼을 누르는 순간이 아니라 **실제 Reject 배출 완료 때 +1**로 바뀐다. Robot2·SM#1·SM#2의 요청 처리와 로봇 동작은 수정하지 않는다. 현장 원인의 정확한 신호 순서는 아직 미확정이며, 아래 절차에 따라 현재 프로그램 대조와 적용 후 시험을 진행한다.

## 1. 확인된 증상과 이번 판단

SM#1 또는 SM#2에서 탈취가 끝나면 R2가 해당 장비에 들어간다. R2가 Blank를 잡고 나오는 중 조업자가 오퍼레이터 판넬의 Reject 버튼을 누른다. 실제로 랙에 놓는 것은 한 장인데 생산 리젝트 적산이 두 번 증가하는 경우가 있다. 랙이 Full이 아닐 때도 발생하며, 랙 카운터는 한 번만 증가한다.

| 구분 | 확인 내용 |
|---|---|
| 현장 관찰 | 실제 Reject 한 건에서 랙 카운터는 +1, 생산 리젝트 적산은 간헐적으로 +2다. |
| 프로그램에서 확인 | 생산 적산은 명령을 타이머로 가공한 신호를, 랙 카운터는 배출 완료 입력을 센다. |
| 모의시험에서 확인 | Full=0이어도 명령 OFF 시간과 완료·Clear 복귀 순서에 따라 기존 생산 적산이 +2가 될 수 있다. |
| 아직 확인할 사항 | 현장에서 실제로 15초 OFF와 신호 재상승이 있었는지, 현재 프로그램·HMI 연결이 분석한 내용과 같은지는 별도 확인한다. |

이 결과는 생산 적산 경로를 먼저 고쳐야 한다는 근거다. 로봇이 실제로 두 장을 배출했다거나 랙 카운터가 잘못됐다고 판단할 근거는 없다. 다만 랙 +1만으로 입력의 모든 순간 변화나 다른 태그 쓰기를 완전히 배제할 수는 없다.

## 2. 이름이 비슷한 두 신호를 구분한다

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적산 신호 비교, 좌우 스크롤 가능">
<table><thead><tr><th>태그</th><th>역할</th><th>위치</th></tr></thead><tbody>
<tr><td><code>z_signal_reject_loaded</code></td><td>Reject 명령을 TOF로 유지한 생산 적산용 신호다. 실제 배출 완료 입력이 아니다.</td><td>Controller 태그이며 Robot2 / Background Rung 25에서 만든다.</td></tr>
<tr><td><code>i_reject_loaded</code></td><td>기존 랙 카운터가 사용하는 배출 완료 입력이다.</td><td>Robot2의 로컬 Alias 태그다.</td></tr>
<tr><td><code>i_r2_reject_loaded</code></td><td>이번에 추가할 생산 적산용 Alias다. 위 완료 입력과 같은 실제 입력을 가리킨다.</td><td>Prod_Tracking의 로컬 Alias 태그로 만든다.</td></tr>
</tbody></table>
</div>

`reject_increment`는 생산 리젝트 적산값이고, `z_R2_Reject_Count`는 랙 매수다. 이번 수정은 랙 매수를 생산 적산값에 복사하는 방식이 아니다. **동일한 배출 완료 입력을 각 카운터가 별도의 ONS로 한 번씩 센다.** 따라서 랙 비우기와 생산 리셋도 서로 분리된 기존 방식을 유지한다.

### 정상 동작하는 랙 카운터: 변경하지 않는다

위치: **CATHODE 1 PLC → Robot2 → Background → 원본 Rung 47**. `i_reject_loaded` 뒤에 `ons_reject_done`이 있고, `z_R2_Reject_Count`에 1을 더하는 렁이다.

```text
XIC(i_reject_loaded)ONS(ons_reject_done)ADD(z_R2_Reject_Count,1,z_R2_Reject_Count);
```

<figure class="ld-rung" data-rung="47" data-rll="XIC(i_reject_loaded)ONS(ons_reject_done)ADD(z_R2_Reject_Count,1,z_R2_Reject_Count);">
<div class="rung-meta"><span class="rung-meta-number">Robot2 / Background 원본 Rung 47 · 변경 없음</span><span class="rung-meta-description">배출 완료 입력의 상승을 검출하여 랙 카운터를 한 번 증가시킨다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev4/rack47.svg" alt="변경하지 않는 랙 완료 적산 Rung 47" width="1040">
</figure>

Gripper Open 자체를 생산 적산 조건으로 사용하지 않는다. 정상 Outfeed에서도 그리퍼는 열리므로, Open만 세면 정상 배출까지 Reject로 셀 수 있다. 제공된 `REJECT1`과 `REJECT`는 Open 호출 후 배출 완료 펄스를 출력한다. PLC 완료 입력과 로봇 출력의 실제 매핑은 현장 I/O 화면으로 대조한다.

## 3. Full이 아니어도 +2가 가능한 이유

### 기존 타이머는 변경하지 않고, 생산 적산에서만 분리한다

위치: **Robot2 → Background → 원본 Rung 25**. Reject 이동 명령을 만드는 Rung 24 바로 아래에서 `tm_RejectWait`와 `z_signal_reject_loaded`를 처리한다.

```text
[XIC(o_load_reject) TOF(tm_RejectWait,?,?) ,XIC(tm_RejectWait.DN) OTE(z_signal_reject_loaded) ];
```

<figure class="ld-rung" data-rung="25" data-rll="[XIC(o_load_reject) TOF(tm_RejectWait,?,?) ,XIC(tm_RejectWait.DN) OTE(z_signal_reject_loaded) ];">
<div class="rung-meta"><span class="rung-meta-number">Robot2 / Background 원본 Rung 25 · 변경 없음</span><span class="rung-meta-description">Reject 명령이 꺼진 뒤에도 타이머 DN으로 기존 적산용 신호를 일정 시간 유지한다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev4/timer25.svg" alt="원인 설명용 기존 TOF Rung 25" width="1040">
</figure>

위 RLL은 원본 확인용이며 이번 입력 대상이 아니다. `?` 표기와 별개로 확인한 `tm_RejectWait.PRE` 값은 **15000ms**다. TOF는 명령이 참이면 DN을 켜고, 명령이 거짓이 된 뒤 설정 시간이 지나면 DN을 끈다. 따라서 버튼을 누르고 15초 뒤에 처음 적산하는 구조가 아니다. [Rockwell TOF 공식 설명](https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/timer-and-counter-instructions/timer-off-delay--tof-.html)

| 순서 | 기존 로직에서 일어날 수 있는 일 | 생산 적산 |
|---|---|---|
| 1 | 판넬 버튼으로 요청이 기억되고, Full=0·Clear=1에서 Reject 명령이 켜진다. | 첫 +1이 발생한다. |
| 2 | R2가 Reject 구역에 들어가 Clear가 꺼진다. Rung 24에 Clear 접점이 있으므로 Full=0이어도 명령이 꺼진다. | 타이머 DN이 유지되는 동안 추가 증가는 없다. |
| 3 | 명령이 꺼진 상태가 15초 이상 지속되어 DN이 꺼지고, 생산 적산 렁이 그 0을 읽는다. | ONS가 다음 상승을 받을 수 있는 상태가 된다. |
| 4 | 요청이 아직 남아 있는 동안 Clear가 복귀하면 명령과 DN이 다시 켜질 수 있다. | 같은 작업인데 추가 +1이 가능하다. |

**비교할 시간은 버튼부터 Open까지의 전체 시간이 아니라 `o_load_reject`가 연속으로 0이었던 시간이다.** 그 시간이 PRE보다 짧고 적산 입력도 계속 1이었다면, 이 타이머 경로만으로 +2를 설명할 수 없다.

### 완료와 Clear가 같이 들어와도 실행 순서가 영향을 준다

Robot2 / Background는 Rung 24에서 명령을 만들고, Rung 25에서 타이머를 처리한 뒤, Rung 48에서 완료에 따른 요청 해제를 한다. Clear와 완료가 같은 실행에서 확인되면, Rung 24가 아직 남아 있는 요청을 먼저 사용할 수 있다.

제공된 고속 `REJECT1`과 저속 `REJECT`는 내부 38행에서 `DO[16]`을 1초 펄스로 출력하고, 39행에서 `DO[6]`을 켠다. 이 두 출력이 PLC의 완료·Clear에 대응하는지는 실제 매핑을 확인한다. 프로그램 행 순서가 PLC에서 반드시 서로 다른 스캔으로 관찰된다는 뜻은 아니다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="명령과 완료 순서별 적산 결과, 좌우 스크롤 가능">
<table><thead><tr><th>구분</th><th>조건</th><th>기존 생산 적산의 가능 결과</th></tr></thead><tbody>
<tr><td>짧은 OFF</td><td>OFF 시간이 15초 미만이고 적산 입력이 계속 1이다.</td><td>이 경로에서는 한 번만 센다.</td></tr>
<tr><td>완료 먼저</td><td>OFF 시간이 15초를 넘지만 완료 처리가 먼저 요청을 해제한다.</td><td>한 번만 셀 수 있다.</td></tr>
<tr><td>Clear 복귀</td><td>OFF 시간이 15초를 넘고 Clear가 먼저 복귀하거나, 완료와 같은 실행에서 복귀한다.</td><td>남아 있던 요청 때문에 두 번 셀 수 있다.</td></tr>
<tr><td>버튼 반복</td><td>버튼을 여러 번 눌러도 같은 요청이 계속 유지된다.</td><td>버튼 횟수만큼 직접 증가하지는 않는다. 적산 입력의 재상승 여부를 봐야 한다.</td></tr>
<tr><td>다른 원인</td><td>적산 입력은 계속 1인데 실제 누적값이 두 번 증가한다.</td><td>ONS 기억값의 다른 쓰기, 카운터 쓰기, HMI 연결과 현장 프로그램 차이를 조사한다.</td></tr>
</tbody></table>
</div>

Full은 명령을 끊는 원인 중 하나일 뿐이다. **Full 대기가 있어야만 +2가 발생하는 것은 아니다.** 타이머를 늘리면 현상이 늦춰질 수 있지만, 서로 다른 두 작업을 한 번으로 합쳐 세는 문제도 생길 수 있어 이번 해결책으로 선택하지 않는다.

## 4. 변경 범위와 유지할 동작

| 항목 | 이번 처리 |
|---|---|
| 생산 적산 | 배출 완료 입력의 0→1마다 한 번 증가하도록 입력 접점만 교체한다. |
| 랙 카운터 | 정상인 Rung 47을 그대로 둔다. 랙 비우기 초기화도 바꾸지 않는다. |
| Robot2 명령·타이머·요청 해제 | Background Rung 24·25·48과 PRE 값을 그대로 둔다. |
| SM#1·SM#2, 로봇, SFC | 수정하지 않는다. 고속·저속 경로와 기존 후속 요청 처리를 유지한다. |
| HMI·판넬 버튼 | 새 태그나 버튼을 추가하지 않는다. 생산 표시 연결도 유지한다. |
| ALL HOME | 기존 처리를 그대로 둔다. 이번 변경으로 전체 요청 취소 기능을 새로 보장하는 것은 아니다. |

후속 SM 요청이 기억되는 동안에는 생산 적산이 올라가지 않는다. 앞 작업의 완료에서 +1, 후속 작업이 실제로 진행되어 완료되면 다시 +1이다. **앞 작업 완료 때 대기 요청까지 미리 세지 않는다.**

같은 실제 작업 중 버튼을 여러 번 눌러도 완료가 한 번이라면 생산 적산은 한 번이다. 다만 기존 요청 로직이 별도의 실제 두 번째 작업을 만들면 두 번째 완료도 센다. 이번 안은 적산 수정이며, 버튼 중복 요청 억제 로직을 추가하는 안은 아니다.

## 5. 적용 전에 현재 프로그램을 확인한다

1. 현재 PLC 프로그램을 백업하고, 생산 적산과 랙 카운터의 시작값을 적는다. 현재 값이나 ONS 기억값을 임의로 0으로 만들지 않는다.
2. Prod_Tracking / Background에서 아래 변경 전 Rung 1이 같은지 확인한다. 번호가 다르면 `reject_increment`에 1을 더하는 로직으로 찾는다.
3. Robot2 / Background의 랙 적산 렁이 `i_reject_loaded`를 사용하는지 확인한다. Robot2 Program Tags에서 이 Alias의 실제 대상 주소를 확인한다.
4. `reject_increment`, `reject_incr_ons`의 Cross Reference를 확인한다. 현재 적산 렁 이외의 쓰기나 다른 ONS에서 기억 비트를 공유하는 부분이 있으면 먼저 검토한다. HMI 연결은 별도로 확인한다.
5. 이전 Rev.3 변경안을 실제 적용했다면 여기서 멈춘다. Robot2 Rung 25·47이 원본과 다를 수 있다. 이전 변경분을 승인된 백업과 대조하여 정리한 뒤 이번 안을 적용한다. 현재 번호만 보고 덮어쓰지 않는다.

**Rev.3의 추가 BOOL·추가 렁과 Rev.4를 혼용하지 않는다.** 이번 문서의 최소 변경량은 Robot2의 해당 로직이 원본인 상태를 기준으로 한다.

## 6. 먼저 로컬 Alias 태그 하나를 만든다

Studio 5000에서 **CATHODE 1 PLC → Programs → Prod_Tracking → Program Tags**를 연다. Controller Tags나 Robot2 Program Tags에 만들지 않는다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="새 Alias 태그 설정, 좌우 스크롤 가능">
<table><thead><tr><th>설정</th><th>입력·확인 내용</th></tr></thead><tbody>
<tr><td>Name</td><td><code>i_r2_reject_loaded</code></td></tr>
<tr><td>Scope</td><td><code>Prod_Tracking</code> Program 로컬이다.</td></tr>
<tr><td>Type</td><td><code>Alias</code>로 만든다. 별도 값을 저장하는 Base BOOL이 아니다.</td></tr>
<tr><td>Alias For</td><td><code>ROBOT2:I1.Input[4].3</code>이다. 반드시 현장 <code>Robot2.i_reject_loaded</code>의 Alias 대상과 같아야 한다.</td></tr>
<tr><td>Data Type</td><td>대상 비트에 따라 <code>BOOL</code>인지 확인한다.</td></tr>
<tr><td>Description</td><td>Robot2 Reject 배출 완료 입력. 생산 리젝트 완료 적산용.</td></tr>
</tbody></table>
</div>

확인한 주소는 위와 같지만, 현장 주소가 다르면 이 숫자를 그대로 입력하지 않는다. 기존 정상 랙 카운터가 사용하는 Alias의 최종 대상과 일치시킨다. 이름만 비슷한 Controller 태그를 선택하지 않는다.

Alias는 같은 입력에 붙이는 이름이므로 별도 초기값·MOV·OTE·복사 렁은 필요 없다. 새 태그를 HMI 쓰기 대상으로 연결하거나 값을 Force하지 않는다. 기존 `i_reject_loaded`와 새 `i_r2_reject_loaded`가 같은 입력을 가리키는지 속성으로 대조한다.

## 7. 기존 생산 적산 렁의 첫 접점만 교체한다

수정 위치는 **CATHODE 1 PLC → Programs → Prod_Tracking → Routines → Background → 원본 Rung 1**이다.

바로 위 원본 Rung 0은 샘플 주기를 복사하는 다음 로직이다.

```text
MOV(ui_i_smpl_frequency,z_smpl_frequency);
```

**이 샘플 주기 복사 렁 바로 아래에 이미 있는 생산 리젝트 적산 렁을 수정한다. 새 렁을 추가하는 것이 아니다.** 바로 다음 원본 Rung 2는 `z_cycle_sample_taken`과 `samples_incr_ons`로 `sample_increment`를 증가시키는 샘플 적산 렁이다. 위아래 샘플 관련 렁은 건드리지 않는다.

### 변경 전: 명령에서 만든 신호를 센다

```text
XIC(z_signal_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);
```

<figure class="ld-rung" data-rung="1" data-rll="XIC(z_signal_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);">
<div class="rung-meta"><span class="rung-meta-number">Prod_Tracking / Background 변경 전 Rung 1</span><span class="rung-meta-description">명령을 타이머로 가공한 신호가 다시 상승할 때마다 생산 리젝트 적산을 증가시킨다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev4/before1.svg" alt="변경 전 생산 리젝트 적산 Rung 1" width="1040">
</figure>

### 변경 후: 실제 Reject 배출 완료를 센다

```text
XIC(i_r2_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);
```

<figure class="ld-rung" data-rung="1" data-rll="XIC(i_r2_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);">
<div class="rung-meta"><span class="rung-meta-number">Prod_Tracking / Background 변경 후 Rung 1</span><span class="rung-meta-description">기존 랙 카운터와 같은 배출 완료 입력의 상승을 검출하여 생산 적산을 한 번 증가시킨다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev4/after1.svg" alt="변경 후 완료 기준 생산 리젝트 적산 Rung 1" width="1040">
</figure>

변경하는 것은 첫 `XIC`의 태그 하나다. 기존 `ONS(reject_incr_ons)`와 `ADD(reject_increment,1,reject_increment)`는 그대로 둔다. 랙 카운터의 `ons_reject_done`을 이 렁에 가져오지 않는다. **두 카운터는 서로 다른 ONS 기억 비트를 사용해야 한다.**

ONS는 앞 조건의 0→1을 한 번 검출한다. 완료 입력이 1초 동안 켜져 여러 스캔에 걸쳐 읽혀도, 중간에 0이 되지 않는 한 한 번만 증가한다. 입력이 다시 0으로 읽힌 뒤 다음 완료가 1이 되면 다음 장을 센다. [Rockwell ONS 공식 설명](https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/bit-instructions1/one-shot--ons-1.html)

### 변경하지 않는 표시·리셋 ST

Prod_Tracking / Background2 / 원본 ST 62행은 변경 전후가 같다. HMI 표시값에 생산 누적을 복사한다.

```text
ui_o_reject_cathodes := reject_increment;
```

Prod_Tracking / Reset / 원본 ST 29행도 변경 전후가 같다. 기존 생산 리셋 때 누적값을 초기화한다.

```text
reject_increment := 0;
```

SFC 변경은 없다. 작업 순서를 바꾸지 않으므로 SFC 수정 그림이나 새로운 Step을 추가하지 않는다.

## 8. 현장에서 입력하고 적용하는 순서

1. 진행 중인 Reject와 대기 요청이 없는 정지 상태를 확보한다. 기존 완료 입력과 새 Alias가 모두 0인 상태에서 작업한다. 완료 펄스 도중에 적산 기준을 교체하지 않는다.
2. 위 절차대로 Prod_Tracking에 Alias 태그를 먼저 만든다. 같은 이름이 이미 있으면 새로 덮어쓰지 말고 Scope와 대상을 확인한다.
3. Prod_Tracking / Background의 해당 렁을 편집한다. 가장 간단한 방법은 첫 접점의 이름만 교체하는 것이다. 전체 렁 텍스트를 입력하는 경우에는 변경 후 코드 한 줄만 사용한다.
4. Studio 5000에서 Verify한다. 태그 미정의, Scope, 피연산자 형식 오류가 있으면 적용하지 않는다. 웹에서 LD가 그려진 것은 PLC Verify 통과를 대신하지 않는다.
5. 현장 Online Edit 절차에 따라 변경을 시험하고 확정한다. 구·신 로직이 각각 독립된 활성 렁으로 남아 동시에 ADD하지 않게 한다. 생산 적산값과 ONS 값을 수동으로 수정하지 않는다.
6. 완료 입력이 0인 정상 실행을 확인한 뒤 승인된 시험 작업 한 건을 진행한다. 버튼을 누를 때 증가하지 않고 완료 때 +1이 되는지 본다.
7. 아래 시험표를 확인하고, 적용 시각·담당자·프로그램 백업·각 카운터 전후값을 기록한다. 이미 잘못 누적된 과거 수량은 이 수정으로 자동 보정되지 않는다.

완료 입력이 이미 1인 상태에서 Run 전환하거나 수정안을 활성화하면 첫 이벤트 처리 결과가 달라질 수 있다. 이를 피하려고 ONS를 강제로 0으로 만들지 않는다. **완료 입력이 0인 비가동 상태에서 적용하고 다음 실제 완료부터 확인한다.**

## 9. 변경 후 동작과 합격 기준

아래 수량은 생산 적산의 증가량이다. 랙 비우기나 Production Reset을 시험 중에 실행했다면 단순한 시작값·종료값 차이로 비교하지 않는다.

| 시험 | 기대 결과 | 함께 확인할 점 |
|---|---|---|
| SM#1 정상 탈취 후 고속 Reject | 버튼 때 +0, 실제 완료 때 +1이다. | 랙 카운터도 +1이어야 한다. |
| SM#2 정상 탈취 후 고속 Reject | 동일하게 완료 때 +1이다. | SM 출처에 따라 차이가 없어야 한다. |
| 미탈취 상태의 저속 Reject | 집기·이동 중 +0, 완료 때 +1이다. | 기존 속도와 집는 위치가 바뀌지 않아야 한다. |
| Auto / Manual | 두 모드 모두 유효한 배출 완료마다 +1이다. | 시험은 현장 허용 동작 범위에서 한다. |
| Full 대기·해제·재개 | 완료 전에는 증가하지 않고, 완료 때 +1이다. | 명령이 재발생해도 완료가 없으면 추가 증가하지 않는다. |
| 앞 작업 중 SM 후속 요청 | 앞 작업 완료 때 +1, 후속 작업 완료 때 추가 +1이다. | 대기 요청 접수만으로 미리 세지 않는다. |
| 같은 작업 중 버튼 반복 | 실제 작업과 완료가 한 건이면 +1이다. | 별도 두 번째 작업 발생 여부는 요청 처리 문제로 구분한다. |
| 완료 입력을 여러 스캔 유지 | +1만 유지한다. | ONS가 입력 유지 시간마다 반복 증가시키면 안 된다. |
| 두 장을 짧은 간격으로 배출 | 완료 사이의 0을 읽었으면 총 +2다. | 두 완료 사이에 15초를 기다릴 필요가 없다. |
| 완료 전 ALL HOME으로 작업 취소 | 완료가 오지 않으면 +0이다. | 요청 취소의 실제 범위는 기존 로직대로이며 별도 대조한다. |
| 완료 후 ALL HOME | 이미 센 수량을 되돌리지 않는다. | 취소 뒤에도 완료 입력이 들어오면 그 입력은 센다. |
| 일반 Outfeed 배출 | Reject 완료 입력이 없으므로 +0이다. | Gripper Open만으로 증가하면 안 된다. |

Full이나 위험한 정지를 일부러 만들거나 I/O를 Force하여 시험하지 않는다. 자연 발생 기록 또는 승인된 비가동 시험으로 확인한다. 실제 완료 입력이 한 작업에서 두 번 상승하거나 유실되는 상황까지 접점 하나로 해결할 수는 없다.

## 10. 논리 모의시험과 확인 범위

문서의 변경 전·후 생산 적산 RLL과 기존 랙 적산 RLL을 같은 래더 파서로 읽고, XIC·ONS·ADD를 실행하는 제한 모델로 비교했다. 명령 생성·TOF·요청 해제는 관련 조건만 남긴 50ms 고정 스캔 모델이다. 실제 로봇 이동, 전체 SFC, 요청 큐, 비동기 통신과 모든 외부 쓰기를 실행한 시험은 아니다.

| 주입한 조건 | 변경 전 생산 적산 | 변경 후 생산 적산 | 랙 적산 |
|---|---:|---:|---:|
| Full=0, 명령 OFF 10초, 완료·Clear 동시 | 1 | 1 | 1 |
| Full=0, 명령 OFF 16초, 완료·Clear 동시 | 2 | 1 | 1 |
| Full=0, 명령 OFF 16초, 완료가 한 스캔 먼저 | 1 | 1 | 1 |
| Full=0, 명령 OFF 16초, Clear가 한 스캔 먼저 | 2 | 1 | 1 |

Full 대기 후 재개, 버튼 유지·반복, 순차 완료 두 건, 완료 입력 유지, 완료 없는 취소와 생산 리셋도 별도 조건으로 확인한다. 여기서 후속 요청은 실제 SM 큐를 실행한 것이 아니라 **순차적인 완료 입력을 주입한 시험**이다. 한 작업에 완료 입력을 두 번 주면 변경 후에도 두 번 세는 한계와, 생산 ONS 기억값을 외부에서 지우면 재적산되는 한계도 검증 결과에 함께 남긴다.

주요 시나리오 15개, 시간·신호 순서 조합 36개, 생산 리셋 조건 1개를 확인했다. 한계 확인용 시험 2개도 예상 결과와 일치했다. LD 4개의 파서 경고는 0건이었다.

**모의시험은 입력 조건에 대한 논리 확인이며 현장 합격 판정이 아니다.** 적용 후에는 위 시험표로 실제 카운터와 동작을 확인한다.

## 11. 필요할 때 수집할 최소 Trend: 8개 한 세트

전부 CATHODE 1 PLC에서 수집한다. 로봇 자체 로그 저장은 필요 없다. Program 태그는 해당 Scope에서 선택한다. 아래 `Program:`은 태그 Scope를 구분한 표기이며 수집 도구의 태그 선택기에 맞춰 선택한다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적산 비교 Trend 태그 8개, 좌우 스크롤 가능">
<table><thead><tr><th>펜</th><th>태그</th><th>구분</th><th>확인할 내용</th></tr></thead><tbody>
<tr><td>1</td><td><code>Program:Robot2.i_reject_loaded</code></td><td>디지털</td><td>실제 완료 입력의 상승 횟수를 본다.</td></tr>
<tr><td>2</td><td><code>Program:Robot2.i_clear_of_reject</code></td><td>디지털</td><td>구역 진입·복귀와 완료의 순서를 본다.</td></tr>
<tr><td>3</td><td><code>Program:Robot2.o_load_reject</code></td><td>디지털</td><td>한 작업에서 명령이 다시 켜지는지 본다.</td></tr>
<tr><td>4</td><td><code>Program:Robot2.tm_RejectWait.ACC</code></td><td>아날로그</td><td>명령 OFF 후 실제 PRE에 도달하는지 본다.</td></tr>
<tr><td>5</td><td><code>z_signal_reject_loaded</code></td><td>디지털</td><td>기존 적산용 신호의 재상승을 본다.</td></tr>
<tr><td>6</td><td><code>Program:Prod_Tracking.reject_increment</code></td><td>아날로그</td><td>생산 적산의 실제 증가량을 본다.</td></tr>
<tr><td>7</td><td><code>Program:Robot2.z_R2_Reject_Count</code></td><td>아날로그</td><td>동일 작업의 랙 증가량과 비교한다.</td></tr>
<tr><td>8</td><td><code>z_i_reject_rb2</code></td><td>디지털</td><td>판넬 요청이 유지·해제되는 시점을 본다.</td></tr>
</tbody></table>
</div>

가능하면 20~50ms로 수집하되 지원 범위와 PLC·통신 부하를 확인한다. 짧은 신호는 Trend 샘플 사이에서 놓칠 수 있으므로 그래프에 없다는 이유만으로 발생하지 않았다고 단정하지 않는다. 버튼 누르기 전부터 배출 완료 뒤까지 기록하고, Full 여부·SM 출처·Auto/Manual·고속/저속·버튼 반복 여부를 사건 메모에 적는다. 기록 중에는 랙 비우기와 생산 리셋을 피한다.

변경 후 생산 적산만 여전히 +2라면 Alias 대상, 남아 있는 구 적산 렁, `reject_incr_ons`의 다른 쓰기, `reject_increment`의 다른 쓰기와 HMI 표시 연결을 먼저 확인한다. 필요하면 다음 기록의 펜 4·5를 새 Alias와 `Program:Prod_Tracking.reject_incr_ons`로 바꾼다. 서로 다른 사건의 로그를 같은 시간축으로 합쳐 원인을 단정하지 않는다.

## 12. 이상이 있을 때 복구한다

1. 동작 중인 Reject와 대기 요청이 없는 상태를 확보하고 완료 입력이 0인지 확인한다. 적용 후 이상 시각과 카운터 값을 먼저 남긴다.
2. **Prod_Tracking / Background의 수정한 Rung 1만** 아래 원본으로 되돌린다. Robot2의 정상 랙 적산 렁은 건드리지 않는다.

```text
XIC(z_signal_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);
```

3. Verify와 현장 편집 확정 절차를 거친다. 구·신 적산 렁이 동시에 실행되지 않는지 확인한다.
4. 새 Alias는 참조가 없음을 확인한 뒤 정리할 수 있다. 실제 I/O 태그와 기존 ONS·카운터·타이머를 삭제하거나 초기화하지 않는다.

복구하면 버튼 부근에서 먼저 세던 기존 방식으로 돌아가며, 기존 +2 위험도 돌아온다. 생산 수량의 사후 보정은 별도 승인·기록으로 처리한다.

## 13. 적용용 파일과 변경 이력

- [변경 후 Rung 1 한 줄 TXT](/downloads/csm-reject-count-error-analysis/rev4/Prod_Tracking_Background_Rung1_after.txt)
- [복구용 원본 Rung 1 한 줄 TXT](/downloads/csm-reject-count-error-analysis/rev4/Prod_Tracking_Background_Rung1_before.txt)
- [Alias 설정과 적용 체크리스트](/downloads/csm-reject-count-error-analysis/rev4/checklist.txt)
- [제한 모의시험·LD 변환 검증 결과](/downloads/csm-reject-count-error-analysis/rev4/verification.json)

TXT는 태그를 먼저 만든 뒤 해당 기존 렁에 입력한다. 별도 새 렁에 추가하지 않는다. 변경 전후 LD는 바로 위 RLL을 동일한 Studio 래더 렌더러로 변환한 것이다.

| 개정 | 변경 내용 |
|---|---|
| Rev.4 · 2026-10-07 | 랙 +1·생산 적산 +2라는 현장 확인을 반영했다. 완료 입력 기준의 접점 하나 교체안으로 문서를 다시 작성하고, 이전 다중 렁 추가안을 적용안에서 제외했다. |
| Rev.3 · 2026-10-06 | 작업 시작 감지용 여러 렁 추가 초안을 검토했다. 이번 Rev.4와 혼용하지 않는다. |
| Rev.2 · 2026-10-05 | 원본 로직에 LD를 추가했다. |
| Rev.1 · 2026-10-05 | 두 Reject 경로와 중복 적산 가설, Trend 수집안을 정리했다. |
