<template>
  <div class="relative w-[200px]">
    <input 
      type="text" 
      v-model="searchStr" 
      @input="filterOptions" 
      @focus="showDropdown = true"
      @blur="hideDropdown"
      @keydown.down.prevent="highlightNext"
      @keydown.up.prevent="highlightPrev"
      @keydown.enter.prevent="selectHighlighted"
      placeholder="search..."
    />

    <ul v-if="showDropdown && filteredOptions.length" class="absolute top-full left-0 right-0 border border-[#ccc] rounded-lg bg-[#333] max-h-[150px] overflow-y-auto list-none m-0 p-0 z-10">
      <li 
        v-for="(option, index) in filteredOptions" 
        :key="option.id"
        class="p-2 cursor-pointer"
        :class="{ 'bg-[#007bff] text-white': index === highlightedIndex }"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option.label }} (#{{ option.id }})
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { AutocompleteCandidate } from 'shared/src/common';
import { ref } from 'vue'


const emit = defineEmits<{
  (e: 'selected-value', value: AutocompleteCandidate): void;
}>()


interface Props {
  optionsFn: (d: string) => Promise<AutocompleteCandidate[]>;
}
const props = defineProps<Props>();


const searchStr = ref('')
const showDropdown = ref(false)
const filteredOptions = ref<AutocompleteCandidate[]>([])
const highlightedIndex = ref(-1)

const filterOptions = async () => {
  // filteredOptions.value = options.filter(option => 
  //   option.toLowerCase().includes(searchStr.value.toLowerCase())
  // )
  // highlightedIndex.value = -1 // reset highlight on new input

  filteredOptions.value = await props.optionsFn(searchStr.value.toLocaleLowerCase());
  showDropdown.value = true;
  highlightedIndex.value = -1 // reset highlight on new input
}

const selectOption = (option: AutocompleteCandidate) => {
  searchStr.value = option.label;
  showDropdown.value = false;
  emit('selected-value', option);
}

const hideDropdown = () => {
  setTimeout(() => showDropdown.value = false, 100)
}

// keyboard navigation
const highlightNext = () => {
  if (filteredOptions.value.length === 0) return
  highlightedIndex.value = (highlightedIndex.value + 1) % filteredOptions.value.length
}

const highlightPrev = () => {
  if (filteredOptions.value.length === 0) return
  highlightedIndex.value = (highlightedIndex.value - 1 + filteredOptions.value.length) % filteredOptions.value.length
}

const selectHighlighted = () => {
  if (filteredOptions.value.length === 1) {
    selectOption(filteredOptions.value[0]);
    emit('selected-value', filteredOptions.value[0]);
  } else if (highlightedIndex.value >= 0) {
    selectOption(filteredOptions.value[highlightedIndex.value]);
    emit('selected-value', filteredOptions.value[highlightedIndex.value]);
  }
}
</script>


