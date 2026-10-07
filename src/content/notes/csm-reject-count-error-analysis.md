---
title: "CSM Reject 적산오류 분석 · Rev.4"
date: "2026-10-07"
excerpt: "Reject 랙에는 한 장을 놓았는데 생산 적산이 두 장 올라가는 문제를 정리했다. 확인할 신호와 접점 하나를 바꾸는 방법도 적었다."
kicker: PLC 변경안
tags: ["CSM", "PLC", "Robot2", "Reject", "Trend"]
---

**Rev.4 · 2026-10-07.** Reject 랙에는 한 장만 놓였는데 생산 리젝트 적산이 가끔 두 장 올라간다. 현장에서 확인한 랙 카운터는 한 장으로 맞다. 두 카운터가 무엇을 보고 올라가는지 확인했고, 생산 적산 렁의 접점 하나를 바꾸는 방법을 아래에 적었다. 이전 Rev.3의 여러 렁을 추가하는 방법은 사용하지 않는다.

> **바꿀 곳은 한 군데다.** `Prod_Tracking`에 Alias 태그 하나를 만들고, `Background`의 원본 Rung 1에서 첫 접점만 교체한다. 바꾸고 나면 버튼을 누를 때가 아니라 R2가 Reject 랙에 놓은 뒤 생산 수량이 올라간다. 실제로 중복 적산이 생긴 순간의 신호 기록은 아직 없으므로, 적용 전에 현장 프로그램과 아래 원본 렁을 대조해야 한다.

## 1. 현장에서 확인한 증상

SM#1이나 SM#2에서 탈취가 끝나면 R2가 Blank를 집으러 들어간다. 조업자는 R2가 Blank를 잡고 나올 때 판넬의 Reject 버튼을 누른다. 이때 랙에는 한 장을 놓았는데 생산 리젝트 적산이 두 번 올라가는 일이 가끔 있다. 랙이 Full이 아닐 때도 그렇다. 랙 카운터는 한 장만 올라간다.

| 구분 | 확인 내용 |
|---|---|
| 현장 | 랙에는 한 장을 놓았고 랙 카운터도 +1이다. 생산 적산만 가끔 +2다. |
| 프로그램 | 생산 적산은 Reject 명령에서 만든 신호를 센다. 랙 카운터는 배출 완료 입력을 센다. |
| 모의시험 | 랙이 Full이 아니어도, 명령이 꺼진 시간과 신호가 돌아온 순서에 따라 +2가 가능하다. |
| 더 확인할 것 | 실제로 명령이 15초 넘게 꺼졌는지, 당시 신호가 어떤 순서로 바뀌었는지 기록이 필요하다. |

현재 확인된 수량 차이를 보면 생산 적산 렁부터 살펴보는 게 맞다. 로봇이 두 장을 놓았다는 기록은 없다. 다만 랙 카운터가 +1이었다는 사실만으로, 생산 적산의 ONS 기억 비트가 다른 곳에서 바뀌는 경우까지 제외할 수는 없다.

## 2. 두 카운터가 읽는 신호

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적산 신호 비교, 좌우 스크롤 가능">
<table><thead><tr><th>태그</th><th>역할</th><th>위치</th></tr></thead><tbody>
<tr><td><code>z_signal_reject_loaded</code></td><td>지금 생산 적산이 읽는 신호다. Reject 명령과 타이머로 만든다.</td><td>Robot2 / Background 원본 Rung 25에서 만든 Controller 태그다.</td></tr>
<tr><td><code>i_reject_loaded</code></td><td>랙 카운터가 읽는 배출 완료 입력이다.</td><td>Robot2의 로컬 Alias 태그다.</td></tr>
<tr><td><code>i_r2_reject_loaded</code></td><td>생산 적산용으로 새로 만들 이름이다. 랙 카운터와 같은 실제 입력을 가리킨다.</td><td>Prod_Tracking의 로컬 Alias 태그로 만든다.</td></tr>
</tbody></table>
</div>

생산 적산값은 `reject_increment`, 랙 매수는 `z_R2_Reject_Count`다. 랙 매수를 생산 적산값에 복사하지는 않는다. **두 카운터가 같은 완료 입력을 보되, 각각 자기 ONS로 한 번씩 세도록 한다.** 랙 비우기와 생산 리셋은 지금처럼 따로 쓴다.

### 랙 카운터는 그대로 둔다

위치는 **CATHODE 1 PLC → Robot2 → Background → 원본 Rung 47**이다. `i_reject_loaded`가 들어오면 `ons_reject_done`으로 한 번만 잡아 랙 카운터를 올린다.

```text
XIC(i_reject_loaded)ONS(ons_reject_done)ADD(z_R2_Reject_Count,1,z_R2_Reject_Count);
```

<figure class="ld-rung" data-rung="47" data-rll="XIC(i_reject_loaded)ONS(ons_reject_done)ADD(z_R2_Reject_Count,1,z_R2_Reject_Count);">
<div class="rung-meta"><span class="rung-meta-number">Robot2 / Background 원본 Rung 47 · 변경 없음</span><span class="rung-meta-description">배출 완료 입력이 0에서 1로 바뀌면 랙 카운터를 한 장 올린다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev4/rack47.svg" alt="변경하지 않는 랙 완료 적산 Rung 47" width="1040">
</figure>

Gripper Open을 적산 조건으로 쓰면 안 된다. 일반 Outfeed에 내려놓을 때도 그리퍼는 열린다. 제공된 `REJECT1`과 `REJECT`에서는 Open을 호출한 뒤 완료 펄스를 낸다. 이 로봇 출력이 PLC의 어떤 입력으로 들어오는지는 현장 I/O 화면에서 확인한다.

## 3. 랙이 Full이 아닌데도 왜 두 번 셀까?

### 생산 적산이 지금 읽는 타이머 신호

**Robot2 → Background → 원본 Rung 25**를 보면, Rung 24에서 만든 Reject 명령이 `tm_RejectWait`를 거쳐 `z_signal_reject_loaded`로 이어진다.

```text
[XIC(o_load_reject) TOF(tm_RejectWait,?,?) ,XIC(tm_RejectWait.DN) OTE(z_signal_reject_loaded) ];
```

<figure class="ld-rung" data-rung="25" data-rll="[XIC(o_load_reject) TOF(tm_RejectWait,?,?) ,XIC(tm_RejectWait.DN) OTE(z_signal_reject_loaded) ];">
<div class="rung-meta"><span class="rung-meta-number">Robot2 / Background 원본 Rung 25 · 변경 없음</span><span class="rung-meta-description">Reject 명령이 꺼져도 타이머 DN으로 적산 신호를 최대 15초 동안 켜 둔다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev4/timer25.svg" alt="원인 설명용 기존 TOF Rung 25" width="1040">
</figure>

이 렁은 위치를 찾고 원인을 이해할 때만 보면 된다. 이번에 고칠 렁은 아니다. `tm_RejectWait.PRE`는 **15000ms**다. RLL의 `?`가 PRE가 없다는 뜻은 아니다. Reject 명령이 켜지면 타이머 DN도 바로 켜지고, 명령이 꺼진 뒤 15초가 지나야 DN이 꺼진다. 따라서 처음 적산되는 시점은 버튼을 누른 뒤 15초가 아니다. [Rockwell TOF 공식 설명](https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/timer-and-counter-instructions/timer-off-delay--tof-.html)

| 순서 | 기존 로직에서 일어날 수 있는 일 | 생산 적산 |
|---|---|---|
| 1 | 판넬 버튼을 누른다. 요청이 남아 있고 랙이 Full이 아니며 Clear가 켜져 있으면 Reject 명령이 켜진다. | 첫 +1이 올라간다. |
| 2 | R2가 Reject 구역에 들어가면서 Clear가 꺼진다. 랙이 Full이 아니어도 Reject 명령은 꺼진다. | 타이머 DN이 켜져 있는 동안에는 더 세지 않는다. |
| 3 | 명령이 15초 넘게 꺼져 DN이 내려가고, 생산 적산 렁도 그 0을 읽는다. | 다음 0→1을 셀 준비가 된다. |
| 4 | 완료 처리가 요청을 지우기 전에 Clear가 돌아오면 Reject 명령과 DN이 다시 켜질 수 있다. | 같은 한 장을 다시 세어 +2가 될 수 있다. |

여기서 재야 할 시간은 버튼을 누른 뒤 Open까지 걸린 시간이 아니다. **`o_load_reject`가 계속 0이었던 시간**이다. 이 시간이 15초보다 짧고 `z_signal_reject_loaded`도 계속 1이었다면, 다른 원인을 찾아야 한다.

### 완료와 Clear가 거의 동시에 돌아올 때

PLC는 Robot2 / Background의 Rung 24에서 명령을 만들고, Rung 25에서 타이머를 처리한 다음, Rung 48에서 완료된 요청을 지운다. Clear와 완료가 같은 실행에서 들어오면, Rung 24는 지워지기 전의 요청을 읽을 수 있다.

고속 `REJECT1`과 저속 `REJECT` 프로그램은 38행에서 `DO[16]`을 1초 동안 켠 뒤, 39행에서 `DO[6]`을 켠다. 로봇 프로그램에서 두 행이 따로 실행되더라도 PLC가 두 신호를 같은 실행에서 읽을 수 있다. 두 출력이 각각 PLC의 어느 입력으로 들어오는지는 현장에서 확인해야 한다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="명령과 완료 순서별 적산 결과, 좌우 스크롤 가능">
<table><thead><tr><th>구분</th><th>조건</th><th>기존 생산 적산의 가능 결과</th></tr></thead><tbody>
<tr><td>15초 미만</td><td>명령이 15초 안에 돌아오고 적산 입력도 계속 1이다.</td><td>이 이유로는 두 번 세지 않는다.</td></tr>
<tr><td>완료 먼저</td><td>명령은 15초 넘게 꺼졌지만 요청이 먼저 지워진다.</td><td>한 번만 셀 수 있다.</td></tr>
<tr><td>Clear 먼저</td><td>명령이 15초 넘게 꺼진 뒤 Clear가 먼저 돌아오거나 완료와 함께 들어온다.</td><td>남아 있는 요청 때문에 두 번 셀 수 있다.</td></tr>
<tr><td>버튼 반복</td><td>같은 요청이 남아 있는 동안 버튼을 여러 번 누른다.</td><td>버튼 횟수만큼 바로 올라가지는 않는다. 적산 입력이 다시 켜지는지 봐야 한다.</td></tr>
<tr><td>신호 유지</td><td>적산 입력은 계속 1인데 누적값이 두 번 올라갔다.</td><td>ONS 기억 비트와 카운터의 다른 쓰기, HMI 표시 연결을 확인한다.</td></tr>
</tbody></table>
</div>

랙 Full 때문에 명령이 끊길 수도 있지만, R2가 Reject 구역에 들어가 Clear가 꺼져도 명령이 끊긴다. 타이머를 길게 잡으면 두 번 세는 일을 잠시 막을 수는 있어도, 이어서 들어온 다른 작업까지 한 장으로 셀 수 있다.

## 4. 실제로 바꿀 곳

| 항목 | 어떻게 할까 |
|---|---|
| 생산 적산 | 입력 접점만 바꾼다. 배출 완료 입력이 0→1이 될 때 한 번 센다. |
| 랙 카운터 | Rung 47과 랙 비우기 기능은 그대로 둔다. |
| Robot2 명령과 타이머 | Background Rung 24·25·48과 PRE 값은 그대로 둔다. |
| SM#1·SM#2와 로봇 | 고속·저속 경로와 대기 중인 요청을 처리하는 방식은 그대로 둔다. |
| HMI·판넬 | 새 버튼을 만들지 않는다. 기존 생산 수량 표시도 그대로 쓴다. |
| ALL HOME | 기존 요청 처리대로 동작한다. 취소 범위가 이번 변경으로 넓어지지는 않는다. |

SM#1이나 SM#2의 다음 Reject 요청이 기다리고 있어도 그 요청만으로 수량이 올라가지는 않는다. 지금 작업이 끝나면 +1, 기다리던 작업이 끝나면 다시 +1이다.

한 작업에서 버튼을 여러 번 눌러도 완료 신호가 한 번만 오면 한 장을 센다. 버튼 때문에 R2가 실제로 두 번째 작업까지 하게 되면 두 번째 완료도 센다. 버튼의 중복 요청을 막는 수정은 여기에 포함되지 않는다.

## 5. 편집하기 전에 확인할 것

1. 현재 PLC 프로그램을 백업하고 생산 적산과 랙 카운터의 값을 적는다. 카운터나 ONS 기억 비트를 임의로 0으로 만들지 않는다.
2. `Prod_Tracking / Background`에서 아래 변경 전 Rung 1을 찾는다. 현장 렁 번호가 다르면 `reject_increment`에 1을 더하는 코드를 보고 찾는다.
3. `Robot2 / Background`의 랙 적산 렁이 `i_reject_loaded`를 읽는지, 그 Alias가 실제 어느 입력을 가리키는지 확인한다.
4. Cross Reference에서 `reject_increment`나 `reject_incr_ons`를 다른 곳에서도 쓰는지 확인한다. HMI가 어느 태그를 표시하는지도 확인한다.
5. Rev.3의 추가 렁을 이미 입력했다면 먼저 현재 내용과 작업 전 백업을 대조한다. 특히 Robot2 Rung 25·47이 아래 설명과 다를 수 있다. 렁 번호만 보고 새 코드를 덮어쓰면 안 된다.

**Rev.3의 추가 BOOL·추가 렁과 아래 Rev.4 코드를 같이 쓰지 않는다.** 아래 설명은 Robot2의 해당 렁이 원본 그대로일 때를 기준으로 한다.

## 6. 태그를 먼저 만든다

Studio 5000에서 **CATHODE 1 PLC → Programs → Prod_Tracking → Program Tags**를 연다. 여기에 아래 태그를 하나 만든다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="새 Alias 태그 설정, 좌우 스크롤 가능">
<table><thead><tr><th>설정</th><th>입력·확인 내용</th></tr></thead><tbody>
<tr><td>Name</td><td><code>i_r2_reject_loaded</code></td></tr>
<tr><td>Scope</td><td><code>Prod_Tracking</code> Program Tags에서 만든다.</td></tr>
<tr><td>Type</td><td><code>Alias</code>를 선택한다.</td></tr>
<tr><td>Alias For</td><td>확인한 주소는 <code>ROBOT2:I1.Input[4].3</code>이다. 현장 <code>Robot2.i_reject_loaded</code>가 가리키는 주소와 같은지 확인한다.</td></tr>
<tr><td>Data Type</td><td>대상 비트의 형식이 <code>BOOL</code>인지 확인한다.</td></tr>
<tr><td>Description</td><td>Robot2 Reject 배출 완료 입력. 생산 리젝트 완료 적산용.</td></tr>
</tbody></table>
</div>

현장 `i_reject_loaded`의 주소가 표와 다르면 현장 주소를 따른다. 두 Alias가 같은 실제 입력을 가리켜야 한다.

Alias는 기존 입력에 이름을 하나 더 붙이는 것이다. 값을 저장하는 BOOL을 새로 만들거나 MOV·OTE로 입력을 복사할 필요가 없다. 새 태그를 만들고 나면 `i_reject_loaded`와 Alias 대상 주소가 같은지 속성에서 다시 본다.

## 7. 생산 적산 렁에서 접점 하나를 바꾼다

위치는 **CATHODE 1 PLC → Programs → Prod_Tracking → Routines → Background → 원본 Rung 1**이다.

바로 위 원본 Rung 0은 샘플 주기를 복사하는 렁이다.

```text
MOV(ui_i_smpl_frequency,z_smpl_frequency);
```

이 렁 바로 아래에 있는 생산 리젝트 적산 렁을 수정한다. 그 아래 원본 Rung 2는 `z_cycle_sample_taken`과 `samples_incr_ons`로 `sample_increment`를 올리는 렁이다. **Rung 0과 2 사이에 새 렁을 넣는 게 아니라, 그 자리에 있는 Rung 1을 고친다.**

### 변경 전: Reject 명령에서 만든 신호를 센다

```text
XIC(z_signal_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);
```

<figure class="ld-rung" data-rung="1" data-rll="XIC(z_signal_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);">
<div class="rung-meta"><span class="rung-meta-number">Prod_Tracking / Background 변경 전 Rung 1</span><span class="rung-meta-description">타이머에서 만든 신호가 0에서 1로 바뀔 때마다 생산 적산을 올린다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev4/before1.svg" alt="변경 전 생산 리젝트 적산 Rung 1" width="1040">
</figure>

### 변경 후: Reject 랙에 놓은 뒤 센다

```text
XIC(i_r2_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);
```

<figure class="ld-rung" data-rung="1" data-rll="XIC(i_r2_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);">
<div class="rung-meta"><span class="rung-meta-number">Prod_Tracking / Background 변경 후 Rung 1</span><span class="rung-meta-description">랙 카운터와 같은 완료 입력이 0에서 1로 바뀌면 생산 적산을 한 장 올린다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev4/after1.svg" alt="변경 후 완료 기준 생산 리젝트 적산 Rung 1" width="1040">
</figure>

첫 `XIC`에 적힌 태그만 바꾼다. 뒤의 `ONS(reject_incr_ons)`와 `ADD(reject_increment,1,reject_increment)`는 그대로 둔다. 랙 카운터에서 쓰는 `ons_reject_done`은 여기에 넣지 않는다. **두 카운터는 각자 ONS 기억 비트를 써야 한다.**

ONS는 입력이 0에서 1로 바뀔 때 한 번만 동작한다. 완료 입력이 1초 동안 켜져 있어도 중간에 꺼지지 않으면 한 장만 센다. 입력이 0으로 돌아왔다가 다음 완료 때 다시 1이 되면 그때 다음 장을 센다. [Rockwell ONS 공식 설명](https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/bit-instructions1/one-shot--ons-1.html)

### 화면 표시와 생산 리셋은 그대로 쓴다

`Prod_Tracking / Background2`의 원본 ST 62행은 생산 적산값을 HMI 표시 태그에 복사한다.

```text
ui_o_reject_cathodes := reject_increment;
```

`Prod_Tracking / Reset`의 원본 ST 29행은 생산 리셋 때 적산값을 지운다. 이 두 줄은 수정하지 않는다.

```text
reject_increment := 0;
```

SFC나 로봇 작업 순서는 바꾸지 않는다.

## 8. 현장에서 적용하는 순서

1. 진행 중인 Reject가 없고 대기 중인 요청도 없는 때에 작업한다. 완료 입력이 0인지 확인한다.
2. `Prod_Tracking`에 Alias 태그를 만든다. 같은 이름이 이미 있다면 Scope와 주소부터 확인한다.
3. `Prod_Tracking / Background`의 생산 적산 렁에서 첫 접점의 태그를 바꾼다. 렁 전체를 입력할 때는 위의 ‘변경 후’ 한 줄을 쓴다.
4. Studio 5000에서 Verify를 실행한다. 태그나 피연산자 오류가 나오면 편집 내용을 확인한다.
5. 현장 Online Edit 절차대로 시험하고 확정한다. 이전 적산 렁과 새 적산 렁을 둘 다 활성화해서는 안 된다. 적산값이나 ONS 기억 비트를 손으로 바꾸지 않는다.
6. 완료 입력이 0인 상태를 확인하고 Reject 한 건을 시험한다. 버튼을 누를 때는 그대로 있고, 실제 완료 때 생산 적산과 랙 카운터가 각각 +1인지 본다.
7. 아래 시험 항목을 확인한 뒤 적용 시각, 담당자, 백업, 두 카운터의 전후값을 적는다. 이전에 잘못 올라간 수량은 자동으로 고쳐지지 않는다.

완료 입력이 켜진 채로 Run 전환하거나 편집을 확정하면 첫 장의 적산이 달라질 수 있다. **입력이 0인 때 적용하고, 그다음 실제 완료부터 확인한다.** ONS 기억 비트를 억지로 0으로 만들지 않는다.

## 9. 작업별로 이렇게 확인한다

아래 수량은 생산 리젝트 적산이 얼마나 늘어야 하는지를 뜻한다. 시험 도중 랙 비우기나 Production Reset을 실행했다면 카운터의 시작값과 종료값만 비교해서는 안 된다.

| 시험 | 기대 결과 | 함께 확인할 점 |
|---|---|---|
| SM#1 탈취 후 빠른 Reject | 버튼을 누를 때는 그대로, 랙에 놓으면 +1이다. | 랙 카운터도 +1인지 본다. |
| SM#2 탈취 후 빠른 Reject | SM#1과 마찬가지로 완료 때 +1이다. | 어느 SM에서 왔든 같아야 한다. |
| 미탈취 상태의 느린 Reject | 집고 이동하는 동안에는 그대로, 완료 때 +1이다. | 속도와 잡는 위치도 이전과 같아야 한다. |
| Auto / Manual | 두 모드에서 완료 신호가 한 번 들어오면 +1이다. | 현장에서 허용하는 작업으로 확인한다. |
| Full 대기 후 재개 | 대기 중에는 그대로, 실제 완료 때 +1이다. | 명령이 다시 켜지는 것만으로 수량이 올라가면 안 된다. |
| 다른 SM의 요청이 뒤에서 대기 | 앞 작업 완료 때 +1, 다음 작업 완료 때 다시 +1이다. | 요청을 받았다는 이유로 미리 세지 않는다. |
| 같은 작업에서 버튼 반복 | 완료가 한 번이면 +1이다. | R2가 실제 두 번째 작업을 했는지는 따로 확인한다. |
| 완료 입력이 여러 스캔 유지 | +1로 멈춰 있어야 한다. | 입력이 계속 1인 동안 다시 올라가면 안 된다. |
| 두 장을 이어서 배출 | 두 완료 사이에 입력 0을 읽었다면 합계 +2다. | 작업 사이에 15초를 기다릴 필요는 없다. |
| 완료 전에 ALL HOME으로 취소 | 완료 입력이 없었다면 +0이다. | 요청 취소 범위는 기존 로직에서 확인한다. |
| 완료 뒤 ALL HOME | 이미 올라간 +1은 그대로다. | ALL HOME 뒤에도 완료 입력이 들어오면 그 입력은 센다. |
| 일반 Outfeed로 배출 | Reject 완료 입력이 없다면 +0이다. | 그리퍼가 열렸다는 이유만으로 올라가면 안 된다. |

Full이나 정지 상황을 일부러 만들지 않는다. 그런 경우는 실제로 발생한 기록이나 비가동 중 허용된 시험으로 확인한다. 완료 입력 자체가 한 작업에서 두 번 들어오거나 빠지는 문제라면 접점 하나를 바꿔서는 해결되지 않는다.

## 10. 모의시험에서는 어떻게 나왔나

변경 전후 적산 렁과 랙 적산 렁을 래더 파서로 읽어 XIC·ONS·ADD를 실행해 봤다. PLC 실행 간격은 50ms로 놓고, Reject 명령·타이머·요청 해제에 필요한 조건만 넣었다. 로봇을 실제로 움직이거나 SM의 모든 SFC와 통신을 재현한 시험은 아니다.

| 주입한 조건 | 변경 전 생산 적산 | 변경 후 생산 적산 | 랙 적산 |
|---|---:|---:|---:|
| Full=0, 명령 OFF 10초, 완료·Clear 동시 | 1 | 1 | 1 |
| Full=0, 명령 OFF 16초, 완료·Clear 동시 | 2 | 1 | 1 |
| Full=0, 명령 OFF 16초, 완료가 한 스캔 먼저 | 1 | 1 | 1 |
| Full=0, 명령 OFF 16초, Clear가 한 스캔 먼저 | 2 | 1 | 1 |

Full 대기, 버튼 반복, 연속 두 건, 완료 입력 유지, 완료 없는 취소, 생산 리셋도 넣어 봤다. 연속 두 건은 실제 SM 대기 로직을 돌린 게 아니라 **완료 입력을 차례로 두 번 넣은 시험**이다. 완료 입력 자체가 한 작업에서 두 번 들어오면 변경 후에도 두 번 센다. 생산 ONS 기억 비트를 다른 곳에서 지워도 다시 셀 수 있다.

조건을 달리한 시험 15개와 신호가 들어오는 순서를 바꾼 시험 36개를 확인했다. 생산 리셋 시험 1개와 위의 한계 시험 2개도 기록했다. 네 개의 LD 그림은 파서 경고 없이 만들어졌다.

이 수치는 정해 놓은 입력을 넣었을 때의 결과다. 현장 적용 뒤에는 9절의 작업별 시험에서 실제 두 카운터를 확인해야 한다.

맨 아래의 JSON은 이 시험을 다시 볼 수 있도록 남긴 결과 파일이다. PLC에 넣는 설정 파일은 아니다. 표에는 대표적인 네 경우만 실었고, 나머지 시험 결과와 한계는 JSON에서 볼 수 있다.

## 11. 신호 기록이 필요하면 이 8개를 본다

모두 CATHODE 1 PLC에서 기록한다. `Program:`이 붙은 태그는 표에 적힌 Program을 열어 선택하면 된다. 로봇에서 로그를 뽑을 필요는 없다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적산 비교 Trend 태그 8개, 좌우 스크롤 가능">
<table><thead><tr><th>펜</th><th>태그</th><th>구분</th><th>확인할 내용</th></tr></thead><tbody>
<tr><td>1</td><td><code>Program:Robot2.i_reject_loaded</code></td><td>디지털</td><td>완료 입력이 한 번 들어왔는지 본다.</td></tr>
<tr><td>2</td><td><code>Program:Robot2.i_clear_of_reject</code></td><td>디지털</td><td>Clear가 꺼지고 돌아온 시각을 본다.</td></tr>
<tr><td>3</td><td><code>Program:Robot2.o_load_reject</code></td><td>디지털</td><td>Reject 명령이 한 작업에서 다시 켜졌는지 본다.</td></tr>
<tr><td>4</td><td><code>Program:Robot2.tm_RejectWait.ACC</code></td><td>아날로그</td><td>명령이 꺼진 동안 타이머가 15000에 도달했는지 본다.</td></tr>
<tr><td>5</td><td><code>z_signal_reject_loaded</code></td><td>디지털</td><td>기존 생산 적산 입력이 두 번 켜졌는지 본다.</td></tr>
<tr><td>6</td><td><code>Program:Prod_Tracking.reject_increment</code></td><td>아날로그</td><td>생산 적산이 언제 몇 장 올라갔는지 본다.</td></tr>
<tr><td>7</td><td><code>Program:Robot2.z_R2_Reject_Count</code></td><td>아날로그</td><td>같은 작업에서 랙 카운터가 몇 장 올라갔는지 본다.</td></tr>
<tr><td>8</td><td><code>z_i_reject_rb2</code></td><td>디지털</td><td>판넬 요청이 언제 들어오고 지워졌는지 본다.</td></tr>
</tbody></table>
</div>

가능하면 20~50ms 간격으로 기록한다. 기록 장치가 지원하는 간격과 PLC·통신 부하부터 확인한다. 짧은 펄스는 기록 사이에 지나갈 수 있으므로 그래프에 안 보인다고 해서 신호가 없었다고 단정하면 안 된다. 버튼을 누르기 전부터 배출이 끝난 뒤까지 남기고, 어느 SM인지, Auto/Manual, 고속/저속, Full, 버튼 반복 여부를 함께 적는다. 기록하는 동안에는 랙 비우기나 생산 리셋을 누르지 않는다.

접점을 바꾼 뒤에도 생산 적산만 +2가 된다면 Alias 주소와 적산 렁을 다시 본다. `reject_incr_ons`나 `reject_increment`를 다른 곳에서도 쓰는지, HMI가 어느 값을 표시하는지도 확인한다. 필요하면 다음 기록에서 펜 4·5 대신 새 Alias와 `Program:Prod_Tracking.reject_incr_ons`를 기록한다. 서로 다른 작업에서 받은 로그는 한 작업의 신호처럼 이어 붙이지 않는다.

## 12. 이상이 생기면 원래 렁으로 돌린다

1. 진행 중인 Reject와 대기 요청이 없고 완료 입력이 0일 때 작업한다. 이상이 생긴 시각과 두 카운터의 값부터 적는다.
2. **Prod_Tracking / Background의 Rung 1**을 아래 원본으로 되돌린다.

```text
XIC(z_signal_reject_loaded)ONS(reject_incr_ons)ADD(reject_increment,1,reject_increment);
```

3. Verify를 마치고 현장 편집 절차대로 확정한다. 생산 적산 렁이 두 개 실행되고 있지 않은지 확인한다.
4. 새 Alias는 더 이상 참조하는 곳이 없을 때 정리할 수 있다. 기존 입력, ONS, 카운터와 타이머 값은 임의로 지우지 않는다.

원래 렁으로 돌리면 버튼을 누른 무렵 수량이 올라가던 방식도 다시 돌아온다. 가끔 +2가 되던 문제도 남는다. 이미 올라간 수량을 맞춰야 한다면 현장 절차에 따라 별도로 기록하고 처리한다.

## 13. 복사할 코드와 변경 이력

- [바꾼 Rung 1 코드](/downloads/csm-reject-count-error-analysis/rev4/Prod_Tracking_Background_Rung1_after.txt)
- [원래 Rung 1 코드](/downloads/csm-reject-count-error-analysis/rev4/Prod_Tracking_Background_Rung1_before.txt)
- [태그 설정과 현장 확인 항목](/downloads/csm-reject-count-error-analysis/rev4/checklist.txt)
- [모의시험 결과 JSON](/downloads/csm-reject-count-error-analysis/rev4/verification.json)

태그를 만든 다음 기존 Rung 1을 편집할 때 첫 번째 TXT를 쓴다. 두 번째 TXT는 원래대로 돌릴 때 쓰는 코드다. 각 LD 그림은 그 바로 위의 RLL을 그린 것이다.

| 개정 | 변경 내용 |
|---|---|
| Rev.4 · 2026-10-07 | 랙은 +1, 생산 적산만 가끔 +2라는 현장 확인을 반영했다. 완료 입력을 세도록 접점 하나를 바꾸는 방법으로 정리했다. |
| Rev.3 · 2026-10-06 | 작업 시작 시점에 세기 위해 렁을 여러 개 추가하는 방법을 검토했다. Rev.4와 함께 사용하지 않는다. |
| Rev.2 · 2026-10-05 | 원본 로직에 LD를 추가했다. |
| Rev.1 · 2026-10-05 | 두 Reject 경로와 중복 적산 가설, Trend 수집안을 정리했다. |
