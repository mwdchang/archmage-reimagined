<template>
  <main class="column" style="align-items: center">
    <div class="section-header">Encyclopedia</div>
    <section class="form" style="width: 20rem; margin-bottom: 10px">
      <div class="row">
        <select style="width: 10rem" v-model="currentSelection" @change="changeSelection">
          <option value="spell">Spells</option>
          <option value="unit">Units</option>
          <option value="item">Items</option>
        </select>
        <input type="text" placeholder="search string" v-model="searchStr" /> 
      </div>

      <div v-if="type ==='spell'"> Showing {{ filteredSpells.length }} of {{ spells.length}} spells.</div>
      <div v-if="type ==='unit'"> Showing {{ filteredUnits.length }} of {{ units.length}} units.</div>
      <div v-if="type ==='item'"> Showing {{ filteredItems.length }} of {{ items.length}} items.</div>
    </section>

    <table v-if="type === 'spell'">
      <tbody>
        <tr v-for="spell of filteredSpells"> 
          <td>
            <div class="row">
              <magic :magic="spell.magic" small />
              <router-link :to="{ name: 'viewSpell', params: { id: spell.id }}"> 
                <div>{{ readableStr(spell.id) }}</div>
              </router-link>
            </div>
          </td>
          <td>
            <div>{{ spell.rank }} </div>
          </td>
          <td class="text-right">
            <div>{{ spell.castingTurn }} </div>
          </td>
          <td>
            <div>{{ spell.attributes.map(readableStr).join(', ') }} </div>
          </td>
        </tr>
      </tbody>
    </table>

    <table v-if="type === 'unit'">
      <tbody>
        <tr v-for="unit of filteredUnits"> 
          <td>
            <div class="row">
              <magic :magic="unit.magic" small />
              <router-link :to="{ name: 'viewUnit', params: { id: unit.id }}"> 
                {{ unit.name }}
              </router-link>
            </div>
          </td>
          <td>
            hp={{ readableNumber(unit.hitPoints) }},
            np={{ readableNumber(unit.powerRank) }}
          </td>
          <td>
            {{ unit.primaryAttackType.join('+') }} /
            {{ readableNumber(unit.primaryAttackPower) }} /
            {{ unit.primaryAttackInit }}
          </td>
          <td>
            <div v-if="unit.secondaryAttackType.length">
              {{ unit.secondaryAttackType.join('+') }} /
              {{ readableNumber(unit.secondaryAttackPower) }} /
              {{ unit.secondaryAttackInit }}
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <table v-if="type === 'item'">
      <tbody>
        <tr v-for="item of filteredItems"> 
          <td> 
            <router-link :to="{ name: 'viewItem', params: { id: item.id }}"> 
              {{ item.name }}
            </router-link>
          </td>
          <td>
            {{ item.attributes.map(readableStr).join(', ') }}
          </td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import Magic from '@/components/magic.vue';
import { getAllLesserItems, getAllUniqueItems, getAllSpells, getAllUnits } from 'engine/src/base/references';
import { Item, Spell } from 'shared/types/magic';
import { readableStr, readableNumber } from '@/util/util';
import { Unit } from 'shared/types/unit';


const props = defineProps<{ type: string }>(); 

const searchStr = ref('');
const currentSelection = ref('');
const router = useRouter();


const spells = ref<Spell[]>([]);
const units = ref<Unit[]>([]);
const items = ref<Item[]>([]);

const filteredSpells = computed(() => {
  const f = searchStr.value ? searchStr.value.toLowerCase() : '';
  return spells.value.filter(d => {
    return d.name.toLowerCase().includes(f)
  });
});

const filteredUnits = computed(() => {
  const f = searchStr.value ? searchStr.value.toLowerCase() : '';
   return units.value.filter(d => {
    return d.name.toLowerCase().includes(f) || 
      d.primaryAttackType.join('.').toLocaleLowerCase().includes(f);
  });
});

const filteredItems = computed(() => {
  const f = searchStr.value ? searchStr.value.toLowerCase() : '';
   return items.value.filter(d => {
    return d.name.toLowerCase().includes(f); 
  });
});

const changeSelection = () => {
  searchStr.value = '';
  router.push({ name: 'encyclopedia', params: { type: currentSelection.value } });
};

onMounted(() => {
  spells.value = getAllSpells();
  units.value = getAllUnits();
  items.value = [...getAllLesserItems(), ...getAllUniqueItems()].sort((a, b) => a.id.localeCompare(b.id));
});

watch(
  () => props.type,
  () => {
    if (props.type) {
      currentSelection.value = props.type;
    }
  },
  { immediate: true }
)

</script>
