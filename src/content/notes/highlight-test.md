---
title: 코드 하이라이트 테스트
date: "2026-08-15"
excerpt: 템플릿으로 파이썬/C++ 발췌가 어떻게 보이는지
---

노트 목록에만 올린 테스트. 프로젝트 타일에는 넣지 않는다.

## Python

```python
def iterdir(self):
    """Yield path objects of the directory contents."""
    root = os.fspath(self)
    with os.scandir(root) as scandir_it:
        paths = [self._make_child_relpath(entry.name)
                 for entry in scandir_it]
    return paths
```

## C++

```cpp
uint8_t checksum(const uint8_t* data, size_t n) {
    uint16_t sum = 0;
    for (size_t i = 0; i < n; ++i)
        sum = static_cast<uint16_t>(sum + data[i]);
    return static_cast<uint8_t>((sum + 0x73) & 0xFF);
}
```
