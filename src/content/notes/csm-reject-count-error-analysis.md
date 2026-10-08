---
title: "CSM Reject 적산오류 분석 · Rev.6"
date: "2026-10-08"
excerpt: "판넬 버튼의 채터링이 중복 적산으로 이어질 수 있는 시점과 확인할 신호를 추가했다. 생산 적산 접점 하나를 바꾸는 수정안은 그대로다."
kicker: PLC 변경안
tags: ["CSM", "PLC", "Robot2", "Reject", "Trend"]
---

**Rev.6 · 2026-10-08.** Reject 랙에는 한 장만 놓였는데 생산 리젝트 적산이 가끔 두 장 올라간다. 현장에서 확인한 랙 카운터는 한 장으로 맞다. 두 카운터가 무엇을 보고 올라가는지 확인했고, 생산 적산 렁의 접점 하나를 바꾸는 방법을 아래에 적었다. 이번에는 **오래된 판넬 버튼의 채터링이 문제를 만들 수 있는 시점**을 15절에 추가했다. 버튼 입력이 완료 처리 직후 다시 켜지는 경우를 모의시험했으며, 실제 접점 불량인지는 아직 확인하지 않았다. PLC 수정안은 Rev.4와 같다. 이전 Rev.3의 여러 렁을 추가하는 방법은 사용하지 않는다.

> **바꿀 곳은 한 군데다.** `Prod_Tracking`에 Alias 태그 하나를 만들고, `Background`의 원본 Rung 1에서 첫 접점만 교체한다. 바꾸고 나면 버튼을 누를 때가 아니라 R2가 Reject 랙에 놓은 뒤 생산 수량이 올라간다. 실제로 중복 적산이 생긴 순간의 신호 기록은 아직 없으므로, 적용 전에 현장 프로그램과 아래 원본 렁을 대조해야 한다.

## 1. 현장에서 확인한 증상

SM#1이나 SM#2에서 탈취가 끝나면 R2가 Blank를 집으러 들어간다. 조업자는 R2가 Blank를 잡고 나올 때 판넬의 Reject 버튼을 누른다. 이때 랙에는 한 장을 놓았는데 생산 리젝트 적산이 두 번 올라가는 일이 가끔 있다. 랙이 Full이 아닐 때도 그렇다. 랙 카운터는 한 장만 올라간다.

| 구분 | 확인 내용 |
|---|---|
| 현장 | 랙에는 한 장만 놓였고 랙 카운터도 +1이다. 생산 적산만 가끔 +2다. |
| 프로그램 | 생산 적산은 Reject 명령에서 만든 신호를 센다. 랙 카운터는 배출 완료 입력을 센다. |
| 모의시험 | 랙이 Full이 아니어도, 명령이 꺼진 시간과 신호가 돌아온 순서에 따라 +2가 가능하다. |
| 더 확인할 것 | 실제로 명령이 15초 넘게 꺼졌는지, 당시 신호가 어떤 순서로 바뀌었는지 기록이 필요하다. |

현재 확인된 수량 차이를 보면 생산 적산 렁부터 살펴봐야 한다. 로봇이 두 장을 놓았다는 기록은 없다. 다만 랙 카운터가 +1이었다고 해서 생산 적산의 ONS 기억 비트가 다른 곳에서 바뀌었을 가능성까지 제외할 수는 없다.

## 2. 두 카운터가 읽는 신호

<div class="note-identifier-table" tabindex="0" role="region" aria-label="적산 신호 비교, 좌우 스크롤 가능">
<table><thead><tr><th>태그</th><th>역할</th><th>위치</th></tr></thead><tbody>
<tr><td><code>z_signal_reject_loaded</code></td><td>지금 생산 적산이 읽는 신호다. Reject 명령과 타이머로 만든다.</td><td>Robot2 / Background 원본 Rung 25에서 만든 Controller 태그다.</td></tr>
<tr><td><code>i_reject_loaded</code></td><td>랙 카운터가 읽는 배출 완료 입력이다.</td><td>Robot2의 로컬 Alias 태그다.</td></tr>
<tr><td><code>i_r2_reject_loaded</code></td><td>생산 적산용으로 새로 만들 이름이다. 랙 카운터와 같은 실제 입력을 가리킨다.</td><td>Prod_Tracking의 로컬 Alias 태그로 만든다.</td></tr>
</tbody></table>
</div>

생산 적산은 `reject_increment`, 랙 매수는 `z_R2_Reject_Count`에 저장된다. 랙 카운터의 값을 생산 적산에 복사하지는 않는다. **두 카운터가 같은 완료 입력을 읽되, 서로 다른 ONS를 써서 각각 한 번씩 센다.** 랙 비우기와 생산 리셋은 지금처럼 따로 쓴다.

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
| 3 | 명령이 15초 넘게 꺼지면 DN도 꺼진다. 생산 적산 렁은 꺼진 신호를 읽는다. | 다음에 신호가 다시 켜지면 셀 수 있는 상태가 된다. |
| 4 | 완료 처리가 요청을 지우기 전에 Clear가 돌아오면 Reject 명령과 DN이 다시 켜질 수 있다. | 같은 한 장을 다시 세어 +2가 될 수 있다. |

여기서 확인할 시간은 버튼을 누른 뒤 그리퍼가 열릴 때까지가 아니다. **`o_load_reject`가 계속 0이었던 시간**이다. 이 시간이 15초보다 짧고 `z_signal_reject_loaded`도 계속 1이었다면, 다른 원인을 찾아야 한다.

### 완료와 Clear가 거의 동시에 돌아올 때

PLC는 Robot2 / Background의 Rung 24에서 명령을 만들고, Rung 25에서 타이머를 처리한 다음, Rung 48에서 완료된 요청을 지운다. Clear와 완료가 같은 실행에서 들어오면, Rung 24는 지워지기 전의 요청을 읽을 수 있다.

고속 `REJECT1`과 저속 `REJECT` 프로그램은 38행에서 `DO[16]`을 1초 동안 켠 뒤, 39행에서 `DO[6]`을 켠다. 로봇 프로그램에서 두 행이 따로 실행되더라도 PLC가 두 신호를 같은 실행에서 읽을 수 있다. 두 출력이 각각 PLC의 어느 입력으로 들어오는지는 현장에서 확인해야 한다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="명령과 완료 순서별 적산 결과, 좌우 스크롤 가능">
<table><thead><tr><th>구분</th><th>조건</th><th>기존 생산 적산의 가능 결과</th></tr></thead><tbody>
<tr><td>15초 미만</td><td>명령이 15초 안에 돌아오고 적산 입력도 계속 1이다.</td><td>타이머가 꺼졌다 다시 켜지는 일은 없으므로 이 경로로는 두 번 세지 않는다.</td></tr>
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
| SM#1·SM#2와 로봇 | 고속·저속 운전과 대기 중인 요청을 처리하는 방식은 그대로 둔다. |
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

**Rev.3의 추가 BOOL·추가 렁과 아래 접점 수정 코드를 같이 쓰지 않는다.** 아래 설명은 Robot2의 해당 렁이 원본 그대로일 때를 기준으로 한다.

## 6. 태그를 먼저 만든다

Studio 5000에서 **CATHODE 1 PLC → Programs → Prod_Tracking → Program Tags**를 연다. 여기에 아래 태그를 하나 만든다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="새 Alias 태그 설정, 좌우 스크롤 가능">
<table><thead><tr><th>설정</th><th>입력·확인 내용</th></tr></thead><tbody>
<tr><td>Name</td><td><code>i_r2_reject_loaded</code></td></tr>
<tr><td>Scope</td><td><code>Prod_Tracking</code> Program Tags에서 만든다.</td></tr>
<tr><td>Type</td><td><code>Alias</code>를 선택한다.</td></tr>
<tr><td>Alias For</td><td>확인한 주소는 <code>ROBOT2:I1.Input[4].3</code>이다. 현장 <code>Robot2.i_reject_loaded</code>가 가리키는 주소와 같은지 확인한다.</td></tr>
<tr><td>Data Type</td><td>대상 비트의 형식이 <code>BOOL</code>인지 확인한다.</td></tr>
<tr><td>Description</td><td><code>Robot2 Reject 배출 완료 입력. 생산 리젝트 완료 적산용.</code>이라고 입력한다.</td></tr>
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
| Full 상태에서 요청이 보류된 뒤 재개 | 완료 입력이 없는 동안에는 그대로다. 실제 배출을 마치고 완료 입력이 들어오면 +1이다. | Full 해제만으로 로봇 동작이 반드시 재개된다고 가정하지 않는다. 요청과 다른 인터록도 확인한다. |
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

Rev.4에서 조건을 달리한 시험 15개와 신호가 들어오는 순서를 바꾼 시험 36개를 확인했다. 생산 리셋 시험 1개와 위의 한계 시험 2개도 기록했다. 당시 네 개의 LD 그림은 파서 경고 없이 만들어졌다. Rev.6의 버튼 입력 시험과 추가 LD는 15절에서 설명한다.

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
- [Rev.6 버튼 재입력 모의시험 결과와 스캔 기록 JSON](/downloads/csm-reject-count-error-analysis/rev6/chatter-verification.json)

태그를 만든 다음 기존 Rung 1을 편집할 때 첫 번째 TXT를 쓴다. 두 번째 TXT는 원래대로 돌릴 때 쓰는 코드다. 각 LD 그림은 그 바로 위의 RLL을 그린 것이다. Rev.5·6에서도 PLC 수정 코드는 Rev.4와 같다. Rev.6 JSON은 버튼 입력을 다시 넣은 시험 결과이며, PLC에 내려받는 파일이 아니다.

| 개정 | 변경 내용 |
|---|---|
| Rev.6 · 2026-10-08 | 판넬 버튼의 채터링과 요청 재등록 조건을 15절에 추가했다. 원본 요청 렁 LD, 9개 모의시험, 버튼 확인용 Trend 8개와 점검 순서를 실었다. PLC 수정 코드는 그대로다. |
| Rev.5 · 2026-10-07 | R2의 빠른·느린 Reject 호출 순서와 Full 조건을 14절에 추가했다. PLC 수정 코드는 Rev.4와 같다. |
| Rev.4 · 2026-10-07 | 랙은 +1, 생산 적산만 가끔 +2라는 현장 확인을 반영했다. 완료 입력을 세도록 접점 하나를 바꾸는 방법으로 정리했다. |
| Rev.3 · 2026-10-06 | 작업 시작 시점에 세기 위해 렁을 여러 개 추가하는 방법을 검토했다. Rev.4·5의 접점 수정안과 함께 사용하지 않는다. |
| Rev.2 · 2026-10-05 | 원본 로직에 LD를 추가했다. |
| Rev.1 · 2026-10-05 | 두 Reject 경로와 중복 적산 가설, Trend 수집안을 정리했다. |

## 14. R2의 두 Reject 프로그램은 언제 실행될까?

R2에는 `REJECT`와 `REJECT1`이 있다. 이름은 비슷하지만 한 장을 처리할 때 두 프로그램을 순서대로 실행하는 구조는 아니다. **SM에서 집기 전에 Reject 조건을 읽으면 `REJECT`로 가고, 정상 방식으로 집은 뒤 메인 프로그램에서 Reject를 선택하면 `REJECT1`로 간다.** 아래 설명은 SM#1과 SM#2에 공통이며, 각각 `UNLOAD_1`과 `UNLOAD_2`에서 같은 종류의 조건을 확인한다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="R2의 Reject 프로그램 선택 조건, 좌우 스크롤 가능">
<table><thead><tr><th>R2가 확인한 시점</th><th>조건과 호출 순서</th><th>실제로 달라지는 점</th></tr></thead><tbody>
<tr><td>SM에서 집기 전</td><td><code>UNLOAD_1</code>은 17행, <code>UNLOAD_2</code>는 14행에서 <code>DI[6:DIE_IN_PERMIT]</code>을 확인한다. ON이면 전용 경로로 가서 <code>CLOSEREJ</code>로 집은 뒤 <code>REJECT</code>를 호출한다.</td><td>탈취되지 않은 Cathode를 다루는 느린 경로다.</td></tr>
<tr><td>정상 방식으로 집은 뒤</td><td><code>RSR0001</code>은 Outfeed 요청을 먼저 확인한다. Reject 조건을 선택하면 61행에서 <code>REJECT1</code>을 호출한다.</td><td>탈취를 마친 Blank를 랙으로 옮기는 빠른 경로다.</td></tr>
<tr><td>조건 확인 중 두 요청이 함께 들어옴</td><td><code>RSR0001</code>은 Outfeed를 먼저 검사한 다음 Reject를 검사한다.</td><td>버튼을 누른 순서만으로 어느 경로가 실행됐다고 판단하면 안 된다.</td></tr>
</tbody></table>
</div>

SM#1은 `UNLOAD_1`, SM#2는 `UNLOAD_2`를 사용한다. 두 프로그램 모두 그리퍼를 열고 해당 장비의 준비 입력을 기다린 다음 `DI[6]`을 읽는다. **이 조건을 읽은 뒤에 버튼을 눌러도 이미 선택한 집기 방식이 중간에 느린 방식으로 바뀌지는 않는다.** 일반 경로에서는 `CLOSE`로 집고 메인 프로그램으로 돌아간다. 이때 R2가 물건을 들고 있고 Reject 조건이 들어오면 메인 프로그램이 `REJECT1`을 호출할 수 있다. 반대로 `DI[6]`이 집기 전 확인 시점에 ON이면 `CLOSEREJ`로 집는다. 이 경로에서는 SM에서 나온 `UNLOAD_1` 또는 `UNLOAD_2`가 `REJECT`를 직접 호출한다.

```text
UNLOAD_1 또는 UNLOAD_2: 집기 전 DI[6] 확인 → ON이면 CLOSEREJ → REJECT
UNLOAD_1 또는 UNLOAD_2: 집기 전 DI[6] 확인 → OFF이면 CLOSE → RSR0001 → Reject 선택 시 REJECT1
```

`CLOSE`와 `CLOSEREJ`도 동작이 다르다. `CLOSE`는 그리퍼를 닫으며 관련 입력을 기다린다. `CLOSEREJ`는 클램프 출력을 바꾸고 정해진 대기 시간을 사용한다. 따라서 느린 경로는 단지 랙으로 이동하는 속도만 낮춘 것이 아니라 집는 순서부터 다르다. `UNLOAD_1`과 `UNLOAD_2`의 느린 경로에는 500mm/sec, 200mm/sec, 10mm/sec 이동이 들어 있다. 랙 부근에서 `REJECT`는 350mm/sec로 움직이고, `REJECT1`은 같은 구간에서 1000mm/sec로 움직인다. 이는 프로그램에 적힌 속도이며, 실제 운전 속도는 로봇의 속도 제한과 현장 설정에도 영향을 받는다.

판넬 Reject 버튼과 HMI Reject 요청은 Operator_Console / Background 원본 Rung 21에서 `z_i_reject_rb2`를 래치한다. Robot2 / Background 원본 Rung 24는 이 요청과 SM 쪽 Reject 조건을 읽고, 랙 Full 입력이 꺼져 있으며 Reject 구역의 Clear 입력이 켜져 있을 때 `o_load_reject`를 만든다. 원본 Rung 48은 배출 완료, SM 관련 완료 조건, ALL HOME 중 해당하는 조건에서 요청을 해제한다. 버튼을 여러 번 눌렀다는 사실만으로 로봇이 몇 번 배출했는지 판단할 수 없는 이유다. 로봇의 `DI[6]`과 PLC의 `o_load_reject`가 현장에서 어떻게 연결되는지는 I/O 화면에서 확인한다.

### 랙에 놓을 때는 두 프로그램의 순서가 같다

두 프로그램은 먼저 `REJ_INDX`를 호출해 `R[15]`에 맞는 랙 위치를 계산한다. 지정 위치로 이동해 `OPEN`으로 그리퍼를 연 뒤 `R[15]`를 하나 올린다. 이후 랙 구역에서 벗어나면서 `DO[16]`을 1초 동안 펄스로 켜고 `DO[6]`을 켠다. `R[15]`는 로봇이 다음에 놓을 위치를 정하는 번호다. PLC의 랙 카운터 `z_R2_Reject_Count`나 생산 적산 `reject_increment`와 같은 값이 아니다.

`DO[16]`이나 `DO[6]`이 PLC의 어느 입력으로 들어오는지는 현재 자료만으로 단정하지 않는다. 현장 I/O 화면에서 `i_reject_loaded`와 `i_clear_of_reject`에 연결된 로봇 출력을 확인해야 한다. **그리퍼가 열렸다는 사실, 로봇의 랙 위치 번호가 증가했다는 사실, PLC의 완료 입력이 들어왔다는 사실은 서로 구분해야 한다.**

### Full이면 무엇이 멈추나?

PLC의 Robot2 / Background 원본 Rung 24에는 `XIO(i_reject_rack_full)`이 있다. Full 입력이 ON이면 이 조건 때문에 `o_load_reject`를 켤 수 없다. 로봇의 `REJECT`와 `REJECT1`도 시작 부분에서 `DO[11]`과 `R[14]`를 검사한다. 두 값으로 판단한 Full 상태라면 메시지를 설정하고 프로그램을 끝내므로 랙으로 들어가는 이동을 실행하지 않는다. 두 프로그램은 한 장을 놓은 뒤 `R[15]`가 12를 넘는지도 확인하고, 넘으면 `R[14]`와 `DO[11]`을 설정한다.

**로봇의 Reject 프로그램 첫머리에는 Full 해제까지 머무는 `WAIT`가 없다.** 요청이 남아 있다면 해제 후 메인 프로그램과 PLC 조건에 따라 다시 진행할 수 있지만, Full 해제만으로 재개가 보장되지는 않는다. 다른 인터록과 요청 상태도 맞아야 한다. 로봇에는 `RACKRST`가 `DO[11]`과 `R[14]`를 끄고 `R[15]`를 1로 되돌리는 코드도 있다. `RESET` 프로그램은 `DI[11]`이 켜지면 `RACKRST`를 호출하도록 작성돼 있다. 이 입력이 현장 랙 비우기 동작과 어떻게 연결되는지 확인해야 한다. `DO[11]`이 PLC의 `i_reject_rack_full`로 연결되는지도 함께 확인한다. PLC의 ALL HOME 요청 해제와 로봇의 랙 Full 초기화를 같은 동작으로 보지 않는다.

### 적산은 어느 순간에 올라가나?

로봇의 `R[15]`는 `OPEN`을 호출한 다음 증가한다. PLC 랙 카운터는 `i_reject_loaded`가 0에서 1로 바뀔 때 증가한다. 7절의 접점 수정안을 적용했다면 생산 적산도 같은 실제 완료 입력을 읽되, 랙 카운터와는 별도의 ONS 기억 비트로 센다. **버튼 한 번이 아니라 실제 완료 입력 한 번에 생산 적산 +1**이라는 뜻이다. 아직 수정안을 적용하지 않았다면 생산 적산은 완료 입력이 아니라 Reject 명령에서 만든 타이머 신호를 센다.

한 작업에서 버튼을 여러 번 눌러도 완료 입력이 한 번이면 수정 후 적산은 +1이다. Full로 보류된 동안 완료 입력이 없다면 적산은 올라가지 않는다. 반대로 완료 입력이 빠지면 0, 한 작업에서 두 번 들어오면 +2가 될 수 있다. 다음 작업까지 실제 두 장을 처리했다면 두 완료 사이에 입력이 0으로 돌아와야 각각 한 번씩 센다. 이 점은 9절의 현장 시험과 11절의 Trend로 확인한다.

조업자에게는 다음 세 가지를 구분해 설명하면 된다. **첫째, SM에서 집기 전에 Reject가 선택되면 느린 `REJECT` 경로다. 둘째, 정상적으로 집은 뒤 메인 프로그램에서 Reject가 선택되면 빠른 `REJECT1` 경로다. 셋째, 버튼·Full 해제·그리퍼 Open만으로 생산 수량이 올라가는 것은 수정 후의 목표 동작이 아니다. 실제 완료 입력을 확인해야 한다.**

## 15. 판넬 Reject 버튼이 채터링하면 두 번 셀까?

**가능한 조건은 있다. 다만 버튼을 처음 누를 때 접점이 몇 번 흔들렸다는 이유만으로 바로 +2가 되지는 않는다.** 요청은 한 번 켜지면 기억된다. 문제가 되는 시점은 완료 처리로 그 요청을 지운 직후다. 이때 버튼 입력이 다시 ON으로 읽히면 요청을 다시 만들 수 있다. 여기에 기존 적산 신호가 이미 꺼져 있었다는 조건까지 겹치면, 랙은 한 장인데 생산 적산만 두 번 올라갈 수 있다.

아래에서 말하는 채터링은 접점이 짧게 붙었다 떨어지는 현상이다. 완료할 때까지 버튼을 오래 누르거나, 놓은 버튼이 늦게 떨어지거나, 접촉 불량으로 나중에 다시 ON이 들어오는 경우도 구분해서 봐야 한다. **처음 누를 때만 생긴 짧은 채터링이 수십 초 뒤의 요청을 저절로 다시 켜는 것은 아니다.** 실제 원인을 가리려면 입력이 흔들린 시각을 확인해야 한다.

### 15-1. 버튼 입력은 어디서 요청이 되나?

위치는 **CATHODE 1 PLC → Operator_Console → Background → 원본 Rung 21**이다. 실제 버튼은 로컬 Alias `i_reject`이며 주소는 `N20:0:I.6`이다. HMI 요청 `ui_i_R2_reject`도 같은 병렬 조건에 연결돼 있다. 둘 중 하나가 ON이면 `z_i_reject`와 `z_i_reject_rb2`를 래치한다. 아래는 분석용 원본이며 이번에 바꾸는 렁이 아니다.

```text
[XIC(i_reject) ,XIC(ui_i_R2_reject) ][OTL(z_i_reject) ,OTL(z_i_reject_rb2) ];
```

<figure class="ld-rung" data-rung="21" data-rll="[XIC(i_reject) ,XIC(ui_i_R2_reject) ][OTL(z_i_reject) ,OTL(z_i_reject_rb2) ];">
<div class="rung-meta"><span class="rung-meta-number">Operator_Console / Background 원본 Rung 21 · 변경 없음</span><span class="rung-meta-description">판넬 또는 HMI Reject 입력이 켜지면 두 요청 비트를 기억한다. 입력이 꺼져도 여기서는 요청을 지우지 않는다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/csm-reject-count-error-analysis/rev6/panel21.svg" alt="판넬과 HMI Reject 입력을 래치하는 원본 Rung 21" width="1040">
</figure>

이 렁에는 버튼용 ONS나 시간 확인용 TON이 없다. 그렇다고 채터링 횟수만큼 요청이 새로 생기는 것도 아니다. OTL은 조건이 꺼져도 이미 켜진 비트를 그대로 둔다. ON→OFF→ON이 반복돼도 요청이 계속 1이라면 새 상승 변화는 없다. [Rockwell OTL 공식 설명](https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/37-00/contents-ditamap/instruction-set/bit-instructions1/output-latch--otl-1.html)

### 15-2. 완료 때 다시 ON이 들어오면 왜 문제가 되나?

확인한 프로그램에서 관련 Program은 50ms 주기의 같은 Task에 들어 있다. 이 작업과 관련된 실행 순서는 **Operator_Console → Prod_Tracking → Robot2**다. Robot2 안에서는 명령을 만드는 Rung 24, 타이머를 처리하는 Rung 25, 랙 카운터 Rung 47, 요청을 지우는 Rung 48 순서로 실행된다.

1. Operator_Console이 버튼 또는 HMI 입력을 읽고 요청을 켠다.
2. Prod_Tracking이 기존 `z_signal_reject_loaded`를 읽어 생산 적산을 처리한다.
3. Robot2 Rung 24는 그 요청과 Clear·Full 조건으로 `o_load_reject`를 만든다. 판넬 요청 분기에는 그리퍼가 물건을 들고 있어야 한다는 조건이 없다.
4. Rung 25에서 명령이 켜지면 타이머 DN과 `z_signal_reject_loaded`가 켜진다.
5. 그 뒤 Rung 48이 완료 입력을 읽고 요청을 지운다. 다음 실행에서도 버튼 입력이 ON이면 1번에서 다시 켤 수 있다.

**Rung 48에서 지운다는 사실만으로 같은 실행의 앞부분에서 만들어진 명령까지 취소되지는 않는다.** 완료 입력이 계속 1인 동안에도 버튼을 다시 읽으면 Rung 24에서는 요청이 1이고 Rung 48을 지난 뒤에는 0일 수 있다. 따라서 Trend에서 `z_i_reject_rb2`가 계속 0으로 보였다는 이유만으로 재등록이 없었다고 단정하면 안 된다. 명령과 적산 입력도 함께 봐야 한다.

Rung 48은 랙 배출 완료만 보고 요청을 지우는 렁이 아니다. `f_reject_st1_done`과 `i_clear_of_station_1`이 함께 켜지거나, SM#2의 같은 조건이 맞거나, `z_ui_i_home_all`이 켜져도 판넬 요청을 지운다. 따라서 점검할 기준은 단순히 “랙에 놓은 뒤”가 아니라 **요청이 지워진 시점에 판넬 또는 HMI 입력이 다시 들어왔는가**다. 아래 시험은 그중 배출 완료로 요청을 지우는 경우를 다뤘다. 다른 해제 조건이 겹친 현장 상황까지 모두 재현한 결과는 아니다.

예를 들어 완료가 Clear보다 먼저 들어와 원래는 한 번만 세는 상황을 놓고, Clear가 돌아오는 실행에 버튼 입력을 한 번 더 넣었다. 아래는 그 모의시험의 순서다. 시각은 시험 시작 기준이며 현장에서 측정한 시간이 아니다.

| 시각 | 넣은 조건과 실행 결과 | 기존 생산 적산 / 랙 |
|---|---|---|
| 0.20초 | 버튼 요청으로 명령과 타이머 DN이 켜진다. 다음 실행에서 생산 적산이 이를 읽는다. | 0.25초에 1 / 0이 된다. |
| 1.00초 이후 | Clear가 꺼져 명령도 꺼진다. 15초가 지난 뒤 생산 적산은 DN=0을 읽는다. | 1 / 0을 유지한다. |
| 16.95초 | 완료 입력이 먼저 들어온다. 랙은 +1이 되고 Rung 48이 요청을 지운다. | 1 / 1이 된다. |
| 17.00초 | Clear가 돌아온다. 이때 버튼 입력도 다시 ON으로 읽히면 요청·명령·DN이 켜진다. 뒤의 Rung 48은 요청을 다시 지운다. | 아직 1 / 1이다. |
| 17.05초 | 생산 적산이 다시 켜진 DN을 읽는다. 완료 입력은 계속 1이므로 랙 ONS는 다시 세지 않는다. | **2 / 1이 된다.** |

이 과정에서 15초는 **실제 버튼 입력이 OFF였던 시간**이 아니라 **Reject 명령이 OFF였던 시간**이다. 요청이 래치돼 명령이 계속 켜져 있다면 버튼을 20초 넘게 놓고 있어도 타이머 DN은 꺼지지 않는다. 반대로 버튼이 전혀 흔들리지 않아도 3절처럼 완료와 Clear의 순서 때문에 +2가 가능하다. 채터링은 가능한 원인 중 하나이지, 지금까지의 모든 +2를 설명하는 확정 원인은 아니다.

완료 입력까지 꺼진 뒤 불필요한 ON이 들어오면 더 주의해야 한다. 이번에는 Rung 48이 바로 지워 주지 않을 수 있어 요청이 남는다. 기존 Outfeed 허가에는 `XIO(z_i_reject_rb2)`가 있으므로 정상 배출을 막거나, 이후 조건에 따라 원하지 않는 Reject 요청으로 남을 수 있다. 생산 적산 접점만 바꾸면 이 요청 문제까지 해결되는 것은 아니다.

### 15-3. 버튼 입력을 넣어 본 결과

원본 버튼 렁의 XIC·OTL과 적산 렁의 XIC·ONS·ADD를 파싱해서 실행했다. 명령·TOF·완료 해제는 판넬 요청에 해당하는 조건만 재현했다. 입력을 한 실행 동안 고정하는 50ms 모델이며, 실제 접점의 수 ms 채터링이나 비동기 I/O, 로봇 전체 동작을 재현한 것은 아니다.

| 시험 조건 | 기존 생산 적산 | 접점 변경 후 | 랙 적산 |
|---|---:|---:|---:|
| 명령 OFF 16초, 완료 먼저, 버튼 재입력 없음 | 1 | 1 | 1 |
| 처음 누를 때만 ON/OFF 반복, 명령 OFF 10초 | 1 | 1 | 1 |
| 버튼 OFF 20초 이상, 요청과 명령은 계속 ON | 1 | 1 | 1 |
| 명령 OFF 16초, 완료로 지운 뒤 버튼 재입력 | **2** | 1 | 1 |
| 같은 재입력이지만 명령 OFF 10초 | 1 | 1 | 1 |
| 완료 펄스까지 끝난 뒤 버튼 재입력 | **2** | 1 | 1 |
| 물리 버튼 대신 HMI 요청이 다시 ON | **2** | 1 | 1 |
| 재입력 때 Full=1, 완료가 요청을 다시 해제 | 1 | 1 | 1 |
| 버튼 재입력 없이 완료·Clear 동시, 명령 OFF 16초 | **2** | 1 | 1 |

아홉 경우 모두 예상값과 맞았다. 접점 변경 전후에 명령·요청·타이머 기록이 같은지도 비교했다. **완료 펄스 뒤 재입력 시험에서는 마지막에 요청이 남았다.** 변경 후 적산이 1이라는 결과를 버튼 문제까지 해결됐다는 뜻으로 읽으면 안 된다. 이 시험은 이후 두 번째 로봇 작업을 실행하지 않았다. 실제로 다른 한 장을 배출하고 완료 입력이 다시 들어오면 변경 후에도 그 한 장을 센다.

[Rev.6 JSON](/downloads/csm-reject-count-error-analysis/rev6/chatter-verification.json)에는 각 시험의 입력과 50ms마다 기록한 값이 들어 있다. `requestAtCommand`는 Rung 24에서 읽은 요청, `request`는 Rung 48을 지난 뒤의 요청이다. `signalAtProduction`은 생산 적산이 읽은 신호이며, `signalAfterRobot2`는 그 실행에서 타이머 처리 후의 신호다. 이 차이를 보면 한 실행 안에서 켰다가 지운 요청도 확인할 수 있다.

### 15-4. 이번에는 버튼 확인용 Trend 8개부터 기록한다

11절은 Clear와 타이머를 보는 세트다. **버튼 접촉 불량을 먼저 확인하려면 아래 세트를 먼저 쓴다.** 두 세트를 한 번에 기록할 필요는 없다. 같은 CATHODE 1 PLC에서 모두 읽을 수 있다.

<div class="note-identifier-table" tabindex="0" role="region" aria-label="판넬 버튼 채터링 확인용 Trend 태그 8개, 좌우 스크롤 가능">
<table><thead><tr><th>펜</th><th>태그</th><th>구분</th><th>확인할 내용</th></tr></thead><tbody>
<tr><td>1</td><td><code>Program:Operator_Console.i_reject</code></td><td>디지털</td><td>판넬 입력이다. 처음 누를 때와 완료 전후에 다시 켜지는지 본다.</td></tr>
<tr><td>2</td><td><code>Program:Operator_Console.ui_i_R2_reject</code></td><td>디지털</td><td>HMI 요청이다. 판넬을 놓았는데 이 입력이 남아 있는지 본다.</td></tr>
<tr><td>3</td><td><code>z_i_reject_rb2</code></td><td>디지털</td><td>요청이 해제되거나 다시 등록되는지 본다. 짧은 변화는 기록에서 빠질 수 있다.</td></tr>
<tr><td>4</td><td><code>Program:Robot2.o_load_reject</code></td><td>디지털</td><td>완료 부근에서 명령이 다시 켜졌는지 본다.</td></tr>
<tr><td>5</td><td><code>z_signal_reject_loaded</code></td><td>디지털</td><td>기존 적산 입력이 0을 거쳐 다시 1이 되는지 본다.</td></tr>
<tr><td>6</td><td><code>Program:Robot2.i_reject_loaded</code></td><td>디지털</td><td>실제 완료 입력이 한 번인지 확인한다.</td></tr>
<tr><td>7</td><td><code>Program:Prod_Tracking.reject_increment</code></td><td>아날로그</td><td>생산 적산이 올라간 시각을 확인한다.</td></tr>
<tr><td>8</td><td><code>Program:Robot2.z_R2_Reject_Count</code></td><td>아날로그</td><td>같은 작업의 랙 적산과 비교한다.</td></tr>
</tbody></table>
</div>

기록 간격은 지원 범위와 부하를 확인한 뒤 가능하면 20~50ms로 잡는다. 작업 전부터 완료 후 수 초까지 남기고, 버튼을 짧게 한 번 눌렀는지 오래 눌렀는지 적는다. **PLC Trend로 수 ms 채터링이 없었다는 사실을 증명할 수는 없다.** Task는 50ms 주기이고 I/O 갱신과 Trend 수집 시점도 서로 다르다. 그래프는 실제 로직에 전달된 변화를 찾는 자료로 쓰고, 접점 자체의 상태는 정비 점검으로 확인한다.

판넬 입력이 완료 무렵 다시 켜지면서 명령·적산 신호도 다시 켜졌다면 버튼 접점, 단자, 배선부터 확인한다. 판넬 입력은 0인데 HMI 요청만 1이라면 버튼 탓으로 보지 않는다. 두 입력 모두 변화가 잡히지 않았는데 +2라면 11절의 Clear·타이머 세트로 다음 작업을 기록하고, ONS와 카운터의 다른 쓰기도 확인한다. 다른 작업에서 받은 두 로그를 같은 사건의 연속 기록처럼 합치지는 않는다.

### 15-5. 무엇부터 조치할까?

**먼저 버튼과 입력 회로를 확인하고, 생산 적산 수정과 버튼 불량 조치를 따로 관리한다.** 다음 순서로 보면 한꺼번에 바꿔서 원인을 놓치는 일을 줄일 수 있다.

1. 비가동 상태에서 현장 안전 절차에 따라 버튼 접점과 단자 체결, 배선을 점검한다. 손을 뗀 뒤에도 입력이 남거나 다시 켜지는지 확인하고, 불량이 확인되면 접점 블록을 교체한다. 가동 중 접점을 임의로 흔들거나 강제 입력으로 시험하지 않는다.
2. 버튼을 수리한 뒤 같은 Trend로 기존 증상이 남는지 본다. 수리만으로 증상이 줄어도 기존 타이머 신호를 세는 구조가 바뀐 것은 아니다.
3. 생산 적산을 완료 기준으로 맞추려면 5~7절의 Alias 설정과 **Prod_Tracking / Background Rung 1 첫 접점 교체**만 적용한다. 완료 입력이 한 번이면 +1인지 9절대로 확인한다. Full·로봇 속도·SM 대기 요청 로직은 바꾸지 않는다.
4. 정상 버튼에서도 오래 누름이나 반복 누름으로 새 요청이 남는 문제가 확인되면, 별도로 요청 재입력 방지안을 검토한다. 이때는 버튼을 놓았음을 확인한 뒤 새 누름을 받는 조건과, 완료 전후 요청 해제 순서를 함께 설계해야 한다. Rung 21에 ONS 하나나 TON 하나만 추가해 모든 경우가 해결된다고 보지 않는다. 다른 SM의 대기 요청을 지우지 않는지도 검증해야 한다.

입력 모듈 필터를 먼저 길게 늘리는 방법도 권하지 않는다. 확인한 `1794-IB16/A`의 0~11번 입력 그룹은 필터 비트가 `000`, `DisableFilter=0`이었다. 공식 표에서 이는 **0.25ms 필터**이며 필터가 없다는 뜻이 아니다. 6번 Reject 입력만 따로 바꾸는 설정이 아니라 같은 그룹에 적용된다. 이 그룹에는 운전·정지 관련 입력과 `ESTOP_09`로 쓰는 11번 입력도 포함돼 있다. 현장 설정을 대조하고 영향 범위를 확인하기 전에는 그룹 필터를 바꾸지 않는다. [Rockwell 1794-IB16 모듈 데이터와 필터 표](https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-03/contents-ditamap/module-information/module-data-types-1794-ib16.html)

정리하면, **짧은 초기 채터링만으로 +2라고 단정할 수는 없지만, 요청 해제 직후의 재입력은 +2와 불필요한 요청을 만들 수 있다.** 접점 하나를 바꾸는 기존 수정안은 생산 적산을 완료 기준으로 바꾸는 방법이다. 낡은 버튼의 접촉 불량이나 중복 요청 자체를 고치는 방법과는 구분해야 한다.
