#pragma once
#include <cstddef>
#include <cstdlib>
#include <cassert>

class ArenaAllocator {
public:
  explicit ArenaAllocator(size_t capacity)
    : capacity_(capacity),
      base_(static_cast<char*>(std::malloc(capacity))),
      offset_(0) {
    assert(base_ != nullptr && "Arena allocation failed");
  }

  ~ArenaAllocator() { std::free(base_); }

  ArenaAllocator(const ArenaAllocator&) = delete;
  ArenaAllocator& operator=(const ArenaAllocator&) = delete;

  void* alloc(size_t size, size_t align = alignof(std::max_align_t)) noexcept {
    size_t padding = (align - (offset_ % align)) % align;
    if (offset_ + padding + size > capacity_) return nullptr;
    void* ptr = base_ + offset_ + padding;
    offset_ += padding + size;
    return ptr;
  }

  void reset() noexcept { offset_ = 0; }

  size_t used() const noexcept { return offset_; }
  size_t remaining() const noexcept { return capacity_ - offset_; }

private:
  size_t capacity_;
  char* base_;
  size_t offset_;
};
