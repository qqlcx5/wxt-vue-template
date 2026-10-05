<script lang="ts" setup>
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui';
import { cn } from '@/utils/cn';

export interface DropdownAction {
  label: string;
  icon?: string;
  kbd?: string;
  destructive?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface DropdownGroup {
  actions: DropdownAction[];
}

interface Props {
  groups?: DropdownGroup[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
  class?: string;
}

withDefaults(defineProps<Props>(), {
  side: 'bottom',
  align: 'end',
  sideOffset: 6,
});
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :side="side"
        :align="align"
        :side-offset="sideOffset"
        :class="cn('z-50 min-w-[9.5rem] rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-zinc-850/95 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.15)] backdrop-blur-2xl animate-in fade-in zoom-in-95 focus:outline-none select-none', $props.class)"
      >
        <slot>
          <template v-for="(group, gIdx) in groups" :key="gIdx">
            <DropdownMenuItem
              v-for="(action, aIdx) in group.actions"
              :key="aIdx"
              :disabled="action.disabled"
              class="flex items-center justify-between rounded-[6px] px-2.5 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none transition-colors data-[highlighted]:bg-apple-blue data-[highlighted]:text-white cursor-pointer"
              :class="{ 'text-red-600 dark:text-red-400 data-[highlighted]:bg-red-500': action.destructive }"
              @select="action.onSelect?.()"
            >
              <div class="flex items-center gap-2">
                <i v-if="action.icon" :class="action.icon" class="text-xs" />
                <span>{{ action.label }}</span>
              </div>
              <span v-if="action.kbd" class="text-[10px] opacity-60 font-mono pl-3">
                {{ action.kbd }}
              </span>
            </DropdownMenuItem>

            <DropdownMenuSeparator
              v-if="gIdx < (groups?.length ?? 0) - 1"
              class="my-1 h-px bg-black/[0.06] dark:bg-white/[0.08]"
            />
          </template>
        </slot>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
