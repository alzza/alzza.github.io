---
title: CSM SM#1·SM#2 Finger 센서 Retry 우회 적용서 안내
description: Finger Retry 우회 적용서는 기존 노트에서 한 곳으로 관리한다.
sidebar:
  label: Finger Retry ON/OFF
  order: 1
---

이 페이지에 있던 이전 Retry Step 전용 RLL은 2026년 9월 21일 개정안과 동작 조건이 다르다. 혼용을 막기 위해 현재 적용서는 아래 노트에서 한 곳으로 관리한다.

[CSM SM#1·SM#2 Finger 센서 Retry 우회 현장 적용서](/notes/sc1-sm12-finger-retry-onoff/)

현재 수정안은 기능 ON을 유지한 채 `f_strip_failed` 발생부터 Gate 진입까지만 센서를 감지 상태로 판단한다. 변경 전·후 LD와 SFC, SM별 태그, 복사용 RLL, 검증 범위는 위 노트에 함께 있다.
