---
title: "차량 건강 주간 리포트 · 2026-08-30"
date: "2026-08-31"
excerpt: "지난주 주행·충전·배터리 추세 요약"
week_start: "2026-08-24"
week_end: "2026-08-30"
risk_level: caution
distance_km: 1054.3
charging_kwh: 166.5
capacity_kwh: 56.1
degradation_percent: -2.4
daily_metrics:
  - { date: "2026-08-24", distance_km: 65.2, charging_kwh: 0 }
  - { date: "2026-08-25", distance_km: 312.7, charging_kwh: 0 }
  - { date: "2026-08-26", distance_km: 104.6, charging_kwh: 39.1 }
  - { date: "2026-08-27", distance_km: 45.1, charging_kwh: 46.78 }
  - { date: "2026-08-28", distance_km: 430.9, charging_kwh: 28 }
  - { date: "2026-08-29", distance_km: 95.8, charging_kwh: 45.1 }
  - { date: "2026-08-30", distance_km: 0, charging_kwh: 7.52 }
capacity_trend:
  - { month: "2025-09", capacity_kwh: 59.4 }
  - { month: "2025-10", capacity_kwh: 58.7 }
  - { month: "2025-11", capacity_kwh: 57.6 }
  - { month: "2025-12", capacity_kwh: 58.8 }
  - { month: "2026-01", capacity_kwh: 58.6 }
  - { month: "2026-02", capacity_kwh: 57.6 }
  - { month: "2026-03", capacity_kwh: 57.6 }
  - { month: "2026-04", capacity_kwh: 57.3 }
  - { month: "2026-05", capacity_kwh: 57.5 }
  - { month: "2026-06", capacity_kwh: 57.1 }
  - { month: "2026-07", capacity_kwh: 54.1 }
  - { month: "2026-08", capacity_kwh: 56.1 }
acceleration_week:
  threshold_kw: 180
  secondary_threshold_kw: 200
  event_count: 14
  secondary_event_count: 4
  max_discharge_power_kw: 217
  avg_peak_power_speed_kmh: 125.1
  max_peak_power_speed_kmh: 138
  covered_distance_km: 1054.3
  events_per_1000km: 13.3
  data_quality: available
acceleration_trend:
  - { month: "2026-08", events_180kw: 16, events_200kw: 5, avg_peak_power_speed_kmh: 120.2, max_peak_power_speed_kmh: 138, covered_distance_km: 1828.5, events_per_1000km: 8.8 }
tags: [TeslaMate, 차량관리, 주간리포트]
---

## 주행

총 주행거리는 1054.3 km, 운행 46회, 총 운행 시간 970분입니다. 100 km 이상 단일 운행이 2회 있었습니다.

## 충전

종료된 세션의 충전량 합계는 166.5 kWh입니다. 완료 6회, 불완전 1회입니다.

## 고출력 가속

180 kW 이상 고출력 가속은 14회, 200 kW 이상은 4회였습니다. 최대 방전출력은 217 kW였고, 각 이벤트의 최대출력 시점 속도는 평균 125.1 km/h, 최고 138 km/h였습니다. 이 값은 TeslaMate 기록 표본을 연속 구간으로 묶은 집계이며, 배터리 열화의 원인이나 기여도를 뜻하지 않습니다.

## 배터리 추세

최신 월 추정 가용용량은 56.1 kWh이고, 최초 기록 대비 -2.4%입니다. 최근 3개월 평균 55.8 kWh, 이전 3개월 평균 57.5 kWh입니다.
이 수치는 충전 세션 기반 추정치와 추세이며, 배터리 상태를 진단한 결과가 아닙니다.

## 판정

주의. 사유: 100 km 이상 단일 운행 2회, 최대속도 150 km/h 이상 운행, 불완전 충전 세션 1건, 최근 추정 가용용량 하락 신호. 최대속도 150 km/h 이상 운행이 있어 관찰 사유에 포함했습니다.
