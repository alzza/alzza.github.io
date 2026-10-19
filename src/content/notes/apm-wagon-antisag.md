---
title: APM 웨건 처짐방지 임시조치방안
date: "2026-10-20"
excerpt: 분배기 부품이 오기 전까지, 웨건이 올라와 있을 때만 기존 펌프 출력과 상승 솔을 짧게 다시 켠다. 수동과 하강에서는 나가지 않는다.
kicker: PLC
tags: ["PLC", "APM", "웨건"]
---

이 글은 L1_APM 웨건 실린더가 이동 중에 내려앉는 현상을, 분배기 부품이 도착하기 전까지 프로그램으로 메우는 임시 조치다. 컨트롤러는 L1_APM이고, 프로그램은 MainProgram이며, 루틴은 s13_WG다. sMain은 고치지 않는다. 0번부터 104번까지는 글자를 그대로 두고, 104번 다음에 11렁을 붙여 105번부터 115번을 만든다.

임시 스위치는 `hmi_enable`이다. 이 비트가 1이면 보충이 돌고, 0이면 71번과 76번이 쓴 출력만 현장으로 나간다. 새 렁은 상승 솔과 펌프를 강제로 끄지 않는다. 다운로드해서 확인하기 전에는 0으로 둔다. 부품을 갈아 넣은 뒤에는 0으로 두고 105번부터 115번을 지우면 수정 전 프로그램과 같다. 이 안은 아직 PLC에 넣어 확인하기 전이다.

## 언제 보충하고 언제 쉬나

보충은 자동이나 반자동에서, 웨건이 올라와 있을 때만 나간다. 올라가서 서 있을 때와, 올라간 채로 전진하거나 후진할 때 짧은 상승이 반복된다.

수동 모드에서는 나가지 않는다. `cWG.Mode_Man`이 켜지면 그 스캔부터 보충 허락이 꺼진다. 리모콘으로 상승, 하강, 전진, 후진하는 동작은 원래 71번, 76번, 주행 렁만 따른다.

하강에서도 나가지 않는다. 하강 명령, 하강 요청, 하강 솔, 하강 센서 확정 가운데 하나라도 있으면 보충을 끊는다. 막 내려가기 시작해 상승 센서가 아직 켜져 있어도 끊는다. 내려간 뒤 전진하거나 후진하는 동안에도 보충은 나가지 않는다. 전진 출력과 후진 출력은 이 로직이 잡지 않는다.

## 왜 짧은 상승을 반복하나

실린더는 네 대이고 상승 솔은 하나다. 유압오일은 펌프에서 나와 릴리프와 방향밸브를 지나고, 파일럿 체크 하나에서 공통 입구가 잠긴 뒤 분배기 두 개로 갈라진다. 잠금은 분배기보다 앞이다. 방향밸브가 가운데로 돌아와도 분배기 안에서 유압오일이 새면, 무거운 쪽 실린더가 내려앉는다. 지금 보이는 현상은 분배기마다 한 대씩 처지는 것이다.

프로그램은 처진 실린더 한 대만 골라 올리지 못한다. 상승 솔을 열면 네 대가 함께 밀린다. 처진 쪽은 유압오일을 다시 받고, 이미 행정 끝인 쪽은 그 0.3초 동안 릴리프를 탄다. 분배기 구멍이 막힌 실린더는 이 펄스로 올라오지 않으므로, 그 경우는 부품을 기다린다.

실제 상승 높이는 아주 낮다. 캐소드가 하단 캐소드 랙에 걸리기 전부터 상승 근접센서는 이미 들어와 있다. 센서가 꺼진 다음에 올리면 캐소드는 이미 랙에 걸린 뒤일 수 있다. 그래서 센서가 들어온 상태를 상승 완료로 보고, 그 상태에서 짧게 반복한다.

## 기존 펌프 출력

펌프용 태그를 새로 만들지 않는다. 웨건 유압모터를 켜는 출력은 `q_WGHY_Run_CMD`이고, 실출력은 `WG:1:O.Data.3`이다. 상승 솔 `q_WGUP_Sol`의 실출력은 `WG:1:O.Data.5`이다.

평소에는 75번이 상승이나 하강 요구가 있을 때 `tm_WG_HYD_On`을 살린다. 요구가 사라져도 이 타이머는 10초 동안 켜진 채로 남는다. 76번은 그 10초가 살아 있고 웨건 기능이 켜져 있으며 유압오일 부족과 고온이 아니면 펌프를 켠다. 조건이 없으면 같은 렁이 매 스캔 펌프를 끈다. 77번은 펌프가 켜진 시간을 2초 세서 `tm_WG_HYD_RunOk`를 만든다. 71번은 그 2초가 끝난 뒤에만 상승 솔을 연다.

웨건이 다 올라가고 전진이나 후진으로 넘어가면 상승 요구가 끝난다. 75번의 10초도 지나면 76번이 펌프를 끈다. 실린더가 내려앉는 시간은 이 구간이다.

76번과 71번은 글자를 그대로 둔다. 새 렁은 104번 뒤에 있으므로 두 OTE보다 뒤에서 같은 출력을 덮는다. 한 스캔의 순서는 아래와 같다.

| 순서 | 렁 | 그 순간 출력 |
|---|---|---|
| 1 | 71번 OTE | 상승 솔을 0으로 쓴다. 이동 중이고 기존 2초 확인도 끝나 있다. |
| 2 | 76번 OTE | 펌프를 0으로 쓴다. 유압 요구 10초가 끝났기 때문이다. |
| 3 | 77번 | 방금 0이 된 펌프를 본다. 기존 2초 타이머는 여기서 쌓이지 않는다. |
| 4 | 114번 OTL | 펌프를 2초 돌린 뒤에만 상승 솔을 1로 덮는다. 솔가동 시간은 0.3초다. |
| 5 | 115번 OTL | 보충 조건이면 `q_WGHY_Run_CMD`를 1로 덮는다. 이 렁이 맨 뒤다. |

출력 카드는 스캔 도중의 0을 내보내지 않는다. 스캔이 끝났을 때의 값을 내보낸다. 115번이 마지막에 1을 썼으면 현장 펌프가 켜지고, 114번이 1을 썼으면 솔이 열린다. 2.3초가 끝나면 114번과 115번이 빠지고, 71번과 76번이 쓴 0만 남는다.

기존 `tm_WG_HYD_RunOk`를 보충에 쓰지 않는 이유는 77번이 115번보다 앞에서 펌프를 보기 때문이다. 보충이 펌프를 켜도 그 타이머는 같은 스캔에 올라가지 않는다. 그래서 110번이 2초를 따로 센다. 그 타이머가 `tm_WG_AntiSag_Lead`다.

`uWG_HYD`는 컨트롤러에 있는 모터 구조체이지만, 프로그램 렁에서는 읽지도 쓰지도 않는다. `q_HY1_CMD`부터 `q_HY4_CMD`는 공장 공통 펌프다. 웨건 유압을 거는 비트는 `q_WGHY_Run_CMD` 하나다.

## 시간과 PRE

현장에서 바꾸는 값은 타이머 PRE다. 단위는 밀리초다. 1초는 1000이다. 분은 60을 곱하면 된다.

| 원하는 시간 | PRE에 넣는 수 | 계산 |
|---|---|---|
| 1초 | 1000 | 1 × 1000 |
| 1분 | 60000 | 1 × 60 × 1000 |
| 3분 | 180000 | 3 × 60 × 1000 |
| 5분 | 300000 | 5 × 60 × 1000 |

처음 값은 실린더 처짐대기시간 30초가 30000, 펌프를 먼저 돌리는 시간 2초가 2000, 솔가동 시간 0.3초가 300, 허용 3시간이 10800000이다. 한 번은 처짐대기 30초, 펌프 2초, 솔가동 0.3초로 이어지고 다시 30초를 기다린다. 첫 보충도 상승이 확정된 뒤 30초를 기다린다. 처짐대기시간을 솔가동 시간보다 짧게 두면 릴리프를 거의 계속 탄다.

3시간은 스위치를 켜 둔 시간이다. 그 사이 하강으로 지나간 시간도 시계에 들어간다. 다만 그때는 솔이 나가지 않는다. 스위치를 껐다 켜면 3시간은 처음부터 센다. 처짐이 남으면 실린더 처짐대기시간을 줄이고, 유압오일 온도가 오르면 처짐대기시간을 늘리거나 솔가동 시간을 줄인다. `aWG_OILT_HH`가 오면 보충은 스스로 멈춘다. 펌프는 3시간 내내 돌지 않고, 솔을 열기 전 2초와 솔가동 0.3초만 돈다.

## 만드는 태그

Controller Tags에 만든다. Program Tags가 아니다. `q_WGHY_Run_CMD`, `q_WGUP_Sol`, `q_WGDOWN_Sol`, `cWG.Mode_Man`은 이미 있으므로 다시 만들지 않는다. BOOL은 켜짐과 꺼짐이고 값은 0이다. TIMER는 PRE에 밀리초를 넣는다.

| 이름 | 데이터형 | 처음 값 | 하는 일 |
|---|---|---|---|
| `hmi_enable` | BOOL | 0 | 임시 스위치다. 1이면 보충하고 0이면 원래 출력만 나간다. |
| `zWG_AntiSag_Run` | BOOL | 0 | 이번 스캔에 보충해도 되는지 나타낸다. |
| `zWG_AntiSag_Pump` | BOOL | 0 | 지금이 펌프를 돌릴 차례인지 나타낸다. |
| `tm_WG_AntiSag_Limit` | TIMER | 10800000 | 스위치를 켜 둔 허용 시간이다. 3시간이다. |
| `tm_WG_AntiSag_Period` | TIMER | 30000 | 실린더 처짐대기시간이다. 30초다. |
| `tm_WG_AntiSag_Lead` | TIMER | 2000 | 솔을 열기 전 펌프만 도는 시간이다. 2초다. |
| `tm_WG_AntiSag_Pulse` | TIMER | 300 | 솔가동 시간이다. 0.3초다. |

1분으로 처짐대기를 바꾸면 Period PRE에 60000을 넣는다. 3분이면 180000, 5분이면 300000이다. 솔가동 시간을 1초로 늘리려면 Pulse PRE에 1000을 넣는다.

## 어디에 붙이나

`s13_WG`를 열고 맨 아래가 104번인지 본다. 글자는 `XIC(i_WG_Stop)TON(tm_WGXBW_LS,?,?);` 이다. 104번 왼쪽 번호를 눌러 렁을 고른 다음, 아래 11줄을 붙인다. 105번부터 115번이 생긴다. 붙인 뒤 71번, 76번, 104번 글자가 붙이기 전과 같은지 비교한다.

11줄 안에는 주석을 넣지 않는다. 로직스에서 주석은 렁 위에 따로 단다. 105번 렁 번호에서 오른쪽 클릭하고 Edit Rung Comment를 고른 뒤 아래 문장을 넣는다.

```text
수정 시작. 여기부터 수정 끝 렁까지가 웨건 처짐방지 임시 조치입니다. 원래대로 되돌리려면 이 렁부터 수정 끝 렁까지 지우고 hmi_enable을 0으로 둡니다. 0번부터 104번까지는 지우지 않습니다.
```

115번에는 이 문장을 넣는다.

```text
수정 끝. 웨건 처짐방지 임시 조치의 마지막 렁입니다. 되돌리려면 수정 시작 렁부터 이 렁까지 지우면 됩니다.
```

주석이 화면에 안 보이면 View 메뉴에서 Rung Comments를 켠다. 주석은 출력을 바꾸지 않는다. `hmi_enable` 태그 설명에도 “1이면 임시 처짐보충, 0이면 원래 로직. 복구 시 수정 시작 렁부터 수정 끝 렁까지 삭제.”를 적으면 태그만 봐도 지울 범위를 찾는다.

Verify에서 솔과 펌프에 Duplicate destructive bit 경고가 나올 수 있다. 71번과 76번 OTE 뒤에 OTL을 두었기 때문이다. 그 두 OTE는 지우지 않는다. 지우면 스위치를 껐을 때 원래 상승이 사라진다.

## 그대로 두는 렁

<figure class="ld-rung" data-rung="71" data-rll="[XIC(cWG.zCycleOn) XIC(uWGZUD.op_UP) ,XIC(cWG_Semi_MoveOn) XIC(op_WG_Semi_FromTo_Up) OTE(zWG_Semi_FomTo_HYD_Up_Req) ,XIC(cWG.Mode_Man) [XIC(uWGZUD.ui_UP_PB) ,XIC(i_WG_XUP) ] XIO(uWGZUD.ui_DOWN_PB) XIO(i_WG_XDN) ]XIC(cWG.zEnable)XIO(tm_WG_Up_Long.DN)XIO(q_WGDOWN_Sol)XIO(tm_WG_Up_Err.DN)OTE(zWG_Up_Req)XIC(tm_WG_HYD_RunOk.DN)OTE(q_WGUP_Sol);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 원본 Rung 71</span><span class="rung-meta-description">s13_WG 원본 71번은 매 스캔 상승 솔 q_WGUP_Sol을 다시 씁니다. 이동 중에는 이 출력이 0입니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_71.svg" alt="s13_WG 원본 Rung 71 LD" width="920" height="900">
</figure>

<figure class="ld-rung" data-rung="76" data-rll="XIC(tm_WG_HYD_On.DN)XIC(cWG.zEnable)XIO(i_WG_LSLL_Oil)XIO(aWG_OILT_HH)OTE(q_WGHY_Run_CMD);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 원본 Rung 76</span><span class="rung-meta-description">s13_WG 원본 76번은 유압 요구가 남은 동안 펌프 q_WGHY_Run_CMD를 켭니다. 요구가 끝나면 이 렁이 펌프를 끕니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_76.svg" alt="s13_WG 원본 Rung 76 LD" width="920" height="284">
</figure>

<figure class="ld-rung" data-rung="77" data-rll="XIC(q_WGHY_Run_CMD)XIO(i_WGHYTrip)TON(tm_WG_HYD_RunOk,?,?);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 원본 Rung 77</span><span class="rung-meta-description">s13_WG 원본 77번은 펌프가 켜진 시간을 2초 세서 tm_WG_HYD_RunOk를 만듭니다. 이 타이머는 76번 직후를 봅니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_77.svg" alt="s13_WG 원본 Rung 77 LD" width="920" height="176">
</figure>

<figure class="ld-rung" data-rung="104" data-rll="XIC(i_WG_Stop)TON(tm_WGXBW_LS,?,?);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 원본 Rung 104</span><span class="rung-meta-description">s13_WG 원본 104번은 루틴의 마지막 기존 렁입니다. 새 11줄은 이 렁 다음에 붙입니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_104.svg" alt="s13_WG 원본 Rung 104 LD" width="920" height="176">
</figure>

## 104번 다음에 생기는 렁

<figure class="ld-rung" data-rung="105" data-rll="XIC(hmi_enable)TON(tm_WG_AntiSag_Limit,10800000,0);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 105</span><span class="rung-meta-description">추가 105번은 hmi_enable이 켜져 있는 시간을 셉니다. 처음 PRE는 3시간인 10800000입니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_105.svg" alt="s13_WG 추가 Rung 105 LD" width="920" height="176">
</figure>

<figure class="ld-rung" data-rung="106" data-rll="XIO(hmi_enable)RES(tm_WG_AntiSag_Limit)RES(tm_WG_AntiSag_Period)RES(tm_WG_AntiSag_Lead)RES(tm_WG_AntiSag_Pulse)OTU(zWG_AntiSag_Pump);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 106</span><span class="rung-meta-description">추가 106번은 스위치가 꺼지면 보충 타이머와 내부 펌프 표시만 지웁니다. 현장 솔과 펌프 출력은 끄지 않습니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_106.svg" alt="s13_WG 추가 Rung 106 LD" width="920" height="284">
</figure>

<figure class="ld-rung" data-rung="107" data-rll="XIC(hmi_enable)XIO(cWG.Mode_Man)XIO(tm_WG_AntiSag_Limit.DN)XIC(tm_WG_Up_LS.DN)XIO(tm_WG_Dn_LS.DN)XIO(uWGZUD.op_DOWN)XIO(zWG_Down_Req)XIO(q_WGDOWN_Sol)XIO(i_WG_LSLL_Oil)XIO(aWG_OILT_HH)XIO(i_WGHYTrip)XIO(EStop)XIC(cWG.zEnable)OTE(zWG_AntiSag_Run);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 107</span><span class="rung-meta-description">추가 107번은 자동이나 반자동이고 상승이 확정됐을 때만 보충을 허락합니다. 수동과 하강에서는 허락하지 않습니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_107.svg" alt="s13_WG 추가 Rung 107 LD" width="920" height="568">
</figure>

<figure class="ld-rung" data-rung="108" data-rll="XIC(zWG_AntiSag_Run)XIO(zWG_AntiSag_Pump)TON(tm_WG_AntiSag_Period,30000,0);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 108</span><span class="rung-meta-description">추가 108번은 실린더 처짐대기시간을 셉니다. 처음 값은 30초이고 PRE는 30000입니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_108.svg" alt="s13_WG 추가 Rung 108 LD" width="920" height="176">
</figure>

<figure class="ld-rung" data-rung="109" data-rll="XIC(zWG_AntiSag_Run)XIC(tm_WG_AntiSag_Period.DN)OTL(zWG_AntiSag_Pump)RES(tm_WG_AntiSag_Period);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 109</span><span class="rung-meta-description">추가 109번은 처짐대기시간이 끝나면 펌프 차례를 켜고 대기 타이머를 비웁니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_109.svg" alt="s13_WG 추가 Rung 109 LD" width="920" height="284">
</figure>

<figure class="ld-rung" data-rung="110" data-rll="XIC(zWG_AntiSag_Pump)TON(tm_WG_AntiSag_Lead,2000,0);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 110</span><span class="rung-meta-description">추가 110번은 솔을 열기 전에 펌프만 먼저 돌리는 2초입니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_110.svg" alt="s13_WG 추가 Rung 110 LD" width="920" height="176">
</figure>

<figure class="ld-rung" data-rung="111" data-rll="XIC(zWG_AntiSag_Pump)XIC(tm_WG_AntiSag_Lead.DN)TON(tm_WG_AntiSag_Pulse,300,0);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 111</span><span class="rung-meta-description">추가 111번은 솔가동 시간입니다. 처음 값은 0.3초이고 PRE는 300입니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_111.svg" alt="s13_WG 추가 Rung 111 LD" width="920" height="176">
</figure>

<figure class="ld-rung" data-rung="112" data-rll="XIC(tm_WG_AntiSag_Pulse.DN)OTU(zWG_AntiSag_Pump)RES(tm_WG_AntiSag_Lead)RES(tm_WG_AntiSag_Pulse);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 112</span><span class="rung-meta-description">추가 112번은 솔가동 시간이 끝나면 출력 래치보다 먼저 펌프 차례와 짧은 타이머를 지웁니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_112.svg" alt="s13_WG 추가 Rung 112 LD" width="920" height="284">
</figure>

<figure class="ld-rung" data-rung="113" data-rll="XIO(zWG_AntiSag_Run)OTU(zWG_AntiSag_Pump)RES(tm_WG_AntiSag_Lead)RES(tm_WG_AntiSag_Pulse);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 113</span><span class="rung-meta-description">추가 113번은 보충 조건이 풀리면 출력 래치보다 먼저 진행 중인 펄스를 끊습니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_113.svg" alt="s13_WG 추가 Rung 113 LD" width="920" height="284">
</figure>

<figure class="ld-rung" data-rung="114" data-rll="XIC(hmi_enable)XIO(cWG.Mode_Man)XIC(zWG_AntiSag_Run)XIC(zWG_AntiSag_Pump)XIC(tm_WG_AntiSag_Lead.DN)XIO(tm_WG_AntiSag_Pulse.DN)XIO(q_WGDOWN_Sol)XIO(zWG_Down_Req)OTL(q_WGUP_Sol);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 114</span><span class="rung-meta-description">추가 114번은 수동이 아니고 펌프가 2초 돈 뒤에만 상승 솔 q_WGUP_Sol을 0.3초 잡습니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_114.svg" alt="s13_WG 추가 Rung 114 LD" width="920" height="426">
</figure>

<figure class="ld-rung" data-rung="115" data-rll="XIC(hmi_enable)XIO(cWG.Mode_Man)XIC(zWG_AntiSag_Run)XIC(zWG_AntiSag_Pump)XIO(q_WGDOWN_Sol)XIO(zWG_Down_Req)OTL(q_WGHY_Run_CMD);">
<div class="rung-meta"><span class="rung-meta-number">L1_APM MainProgram s13_WG 추가 Rung 115</span><span class="rung-meta-description">추가 115번은 같은 조건에서 기존 펌프 출력 q_WGHY_Run_CMD를 잡습니다. 76번보다 뒤입니다.</span><span class="rung-status ok">LD 변환</span></div>
<img src="/images/notes/apm-wagon-antisag/ld_rung_115.svg" alt="s13_WG 추가 Rung 115 LD" width="920" height="284">
</figure>

## 붙여 넣을 11줄

설명 문장은 넣지 않고 이 문장만 복사한다. 같은 문장은 [붙여 넣을 파일](/downloads/apm-wagon-antisag-paste.txt)에도 있다.

```text
XIC(hmi_enable)TON(tm_WG_AntiSag_Limit,10800000,0);
XIO(hmi_enable)RES(tm_WG_AntiSag_Limit)RES(tm_WG_AntiSag_Period)RES(tm_WG_AntiSag_Lead)RES(tm_WG_AntiSag_Pulse)OTU(zWG_AntiSag_Pump);
XIC(hmi_enable)XIO(cWG.Mode_Man)XIO(tm_WG_AntiSag_Limit.DN)XIC(tm_WG_Up_LS.DN)XIO(tm_WG_Dn_LS.DN)XIO(uWGZUD.op_DOWN)XIO(zWG_Down_Req)XIO(q_WGDOWN_Sol)XIO(i_WG_LSLL_Oil)XIO(aWG_OILT_HH)XIO(i_WGHYTrip)XIO(EStop)XIC(cWG.zEnable)OTE(zWG_AntiSag_Run);
XIC(zWG_AntiSag_Run)XIO(zWG_AntiSag_Pump)TON(tm_WG_AntiSag_Period,30000,0);
XIC(zWG_AntiSag_Run)XIC(tm_WG_AntiSag_Period.DN)OTL(zWG_AntiSag_Pump)RES(tm_WG_AntiSag_Period);
XIC(zWG_AntiSag_Pump)TON(tm_WG_AntiSag_Lead,2000,0);
XIC(zWG_AntiSag_Pump)XIC(tm_WG_AntiSag_Lead.DN)TON(tm_WG_AntiSag_Pulse,300,0);
XIC(tm_WG_AntiSag_Pulse.DN)OTU(zWG_AntiSag_Pump)RES(tm_WG_AntiSag_Lead)RES(tm_WG_AntiSag_Pulse);
XIO(zWG_AntiSag_Run)OTU(zWG_AntiSag_Pump)RES(tm_WG_AntiSag_Lead)RES(tm_WG_AntiSag_Pulse);
XIC(hmi_enable)XIO(cWG.Mode_Man)XIC(zWG_AntiSag_Run)XIC(zWG_AntiSag_Pump)XIC(tm_WG_AntiSag_Lead.DN)XIO(tm_WG_AntiSag_Pulse.DN)XIO(q_WGDOWN_Sol)XIO(zWG_Down_Req)OTL(q_WGUP_Sol);
XIC(hmi_enable)XIO(cWG.Mode_Man)XIC(zWG_AntiSag_Run)XIC(zWG_AntiSag_Pump)XIO(q_WGDOWN_Sol)XIO(zWG_Down_Req)OTL(q_WGHY_Run_CMD);
```
