<script setup>
import { computed } from 'vue';
import {
  MATCHUP_DIFFICULTIES,
  getDifficultyLabel,
  getDifficultyTagType,
} from '../config/lol-matchup-difficulty.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  allowEmpty: { type: Boolean, default: true },
  placeholder: { type: String, default: '—' },
  size: { type: String, default: 'sm' },
  variant: { type: String, default: 'bordered' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const elSize = computed(() => (props.size === 'md' ? 'default' : 'small'));

const options = computed(() => {
  const list = MATCHUP_DIFFICULTIES.map((item) => ({
    value: item.id,
    label: item.label,
  }));

  if (props.allowEmpty) {
    return [{ value: '', label: props.placeholder }, ...list];
  }

  return list;
});

function onChange(value) {
  emit('update:modelValue', value ?? '');
}
</script>

<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :size="elSize"
    :class="variant === 'select' ? 'difficulty-select-filter' : 'difficulty-select-plain'"
    :clearable="allowEmpty && variant === 'select'"
    @update:model-value="onChange"
  >
    <template v-if="variant !== 'select'" #label="{ value }">
      <el-tag
        v-if="value"
        :type="getDifficultyTagType(value)"
        size="small"
        effect="light"
        round
      >
        {{ getDifficultyLabel(value) }}
      </el-tag>
      <span v-else class="text-subtle">{{ placeholder }}</span>
    </template>

    <el-option
      v-for="item in options"
      :key="item.value || '__empty'"
      :label="item.label"
      :value="item.value"
    >
      <el-tag
        v-if="item.value"
        :type="getDifficultyTagType(item.value)"
        size="small"
        effect="light"
        round
      >
        {{ item.label }}
      </el-tag>
      <span v-else class="text-muted">{{ item.label }}</span>
    </el-option>
  </el-select>
</template>
