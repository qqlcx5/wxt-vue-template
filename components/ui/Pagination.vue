<script lang="ts" setup>
import { computed } from 'vue';
import {
  PaginationRoot,
  PaginationList,
  PaginationListItem,
  PaginationPrev,
  PaginationNext,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
} from 'reka-ui';
import Select, { type SelectOption } from './Select.vue';
import { cn } from '@/utils/cn';

export interface PaginationProps {
  page?: number;
  modelValue?: number;
  total: number;
  itemsPerPage?: number;
  pageSizeOptions?: number[];
  siblingCount?: number;
  showEdges?: boolean;
  showTotal?: boolean;
  showPageSize?: boolean;
  disabled?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<PaginationProps>(), {
  total: 0,
  itemsPerPage: 20,
  siblingCount: 1,
  showEdges: true,
  showTotal: true,
  showPageSize: false,
  disabled: false,
});

const emits = defineEmits<{
  (e: 'update:page', val: number): void;
  (e: 'update:modelValue', val: number): void;
  (e: 'update:itemsPerPage', val: number): void;
  (e: 'change', page: number): void;
}>();

const currentPage = computed({
  get: () => props.page ?? props.modelValue ?? 1,
  set: (val: number) => {
    emits('update:page', val);
    emits('update:modelValue', val);
    emits('change', val);
  },
});

const currentItemsPerPage = computed({
  get: () => props.itemsPerPage,
  set: (val: number) => {
    emits('update:itemsPerPage', val);
    currentPage.value = 1;
  },
});

const pageCount = computed(() => {
  if (props.total <= 0) return 1;
  return Math.ceil(props.total / props.itemsPerPage);
});

const pageSizeSelectOptions = computed<SelectOption[]>(() => {
  const opts = props.pageSizeOptions || [20, 50, 100, 200, 500];
  return opts.map((size) => ({
    value: String(size),
    label: `${size} 条/页`,
  }));
});
</script>

<template>
  <div :class="cn('flex items-center justify-between gap-3 text-xs select-none flex-wrap py-2', $props.class)">
    <!-- 左侧：统计摘要与每页条数切换 -->
    <div class="flex items-center gap-2.5 text-neutral-500">
      <span v-if="showTotal">
        共 <strong class="text-neutral-800 dark:text-neutral-200">{{ total }}</strong> 条
        <span class="opacity-60 ml-1">({{ currentPage }} / {{ pageCount }} 页)</span>
      </span>

      <div v-if="showPageSize && pageSizeOptions?.length" class="flex items-center gap-1.5 ml-1">
        <Select
          :model-value="String(currentItemsPerPage)"
          :options="pageSizeSelectOptions"
          size="xs"
          trigger-class="w-26 h-6.5 text-[11px]"
          @update:model-value="(val: any) => currentItemsPerPage = Number(val)"
        />
      </div>
    </div>

    <!-- 右侧：分页导航按钮组 -->
    <PaginationRoot
      :page="currentPage"
      :total="total"
      :items-per-page="itemsPerPage"
      :sibling-count="siblingCount"
      :show-edges="showEdges"
      :disabled="disabled"
      class="flex items-center gap-1"
      @update:page="(p) => currentPage = p"
    >
      <!-- 第一页 -->
      <PaginationFirst
        class="h-7 w-7 rounded-lg flex items-center justify-center border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="第一页"
      >
        <i class="i-lucide-chevrons-left text-xs" />
      </PaginationFirst>

      <!-- 上一页 -->
      <PaginationPrev
        class="h-7 w-7 rounded-lg flex items-center justify-center border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="上一页"
      >
        <i class="i-lucide-chevron-left text-xs" />
      </PaginationPrev>

      <!-- 页码列表 -->
      <PaginationList v-slot="{ items }" class="flex items-center gap-1">
        <template v-for="(item, index) in items" :key="index">
          <PaginationListItem
            v-if="item.type === 'page'"
            :value="item.value"
            class="h-7 min-w-7 px-2 rounded-lg flex items-center justify-center text-xs font-medium transition-all duration-150 border-0 outline-none cursor-pointer data-[selected]:bg-[#007AFF] data-[selected]:text-white data-[selected]:shadow-xs text-neutral-700 dark:text-neutral-300 hover:data-[selected=false]:bg-black/[0.05] dark:hover:data-[selected=false]:bg-white/[0.08]"
          >
            {{ item.value }}
          </PaginationListItem>

          <PaginationEllipsis
            v-else
            :key="item.type"
            :index="index"
            class="h-7 w-7 flex items-center justify-center text-neutral-400 text-xs"
          >
            &#8230;
          </PaginationEllipsis>
        </template>
      </PaginationList>

      <!-- 下一页 -->
      <PaginationNext
        class="h-7 w-7 rounded-lg flex items-center justify-center border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="下一页"
      >
        <i class="i-lucide-chevron-right text-xs" />
      </PaginationNext>

      <!-- 末页 -->
      <PaginationLast
        class="h-7 w-7 rounded-lg flex items-center justify-center border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        title="最后页"
      >
        <i class="i-lucide-chevrons-right text-xs" />
      </PaginationLast>
    </PaginationRoot>
  </div>
</template>
