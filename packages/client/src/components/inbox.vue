<template>
  <main class="flex flex-col gap-[10px] min-w-[35rem]">

    <section class="form"> 
      <div class="flex flex-row items-center gap-[5px] justify-between">
        <ActionButton 
          :proxy-fn="compose"
          :label="'Compose'" />

        <div class="flex flex-row items-center gap-2">
          <ActionButton 
            v-if="currentView === 'listView'"
            :proxy-fn="deleteBM"
            :type="'warn'"
            :label="'Delete BM'" />

          <ActionButton 
            v-if="currentView === 'listView'"
            :proxy-fn="markAllRead"
            :type="'warn'"
            :label="'Mark all read'" />
        </div>

      </div>
    </section>

    <section class="w-full flex flex-col text-[0.9rem]" v-if="currentView === 'listView'">
      <h3>Messages</h3>
      <div class="overflow-y-auto flex-grow" id="messageList">
        <div v-for="message of mails" 
          :key="message.id"
          class="p-[0.20rem] border-b border-[#888] cursor-pointer hover:bg-[#505050]"
          @click="openMail(message)">
          <div class="flex flex-row items-center gap-[5px] justify-between" :class="{ 'font-semibold bg-[#333]': message.read === false}">
            <div :class="{ 'font-semibold bg-[#333]': message.read === false }"> {{ message.subject }}</div>
            <div :class="{ 'font-semibold bg-[#333]': message.read === false }" class="text-[#888] text-[0.75rem]"> {{ readableDate(message.timestamp) }}</div>
          </div>
        </div>
        <div v-if="mails.length === 0">
          You have no messages
        </div>
      </div>
    </section>

    <section class="w-full flex flex-col text-[0.9rem]" v-if="currentView === 'composeView'">
      <div class="form" v-if="currentMail">
        <div class="flex flex-row items-baseline gap-4">

          <Autocomplete 
            v-if="!targetMage"
            @selected-value="setAutoComplete"
            :options-fn="searchMageRank" 
          />
          <div v-else class="flex flex-row items-center gap-[5px] mb-4 text-[#18d]">
            <div>{{ targetMage.label }} (#{{ targetMage.id}})</div>
            <svg-icon name="remove" size="1.5rem" @click="targetMage = null" /> 
          </div>



        </div>

        <div class="flex flex-row items-baseline gap-[5px]">
          <input type="text" placeholder="subject..." v-model="currentMail.subject" />
        </div>
        <textarea
          v-model="currentMail.content"
          class="w-full h-[12rem] bg-[#2a2a2a] text-[#f1f1f1] border border-[#444] mb-2 p-[0.50rem]"
          placeholder="content..."></textarea>

        <div class="flex flex-row items-center gap-[2px] justify-between">
          <ActionButton 
            :proxy-fn="back"
            :label="'Back'" />

          <ActionButton 
            :disabled="(!currentMail.target || currentMail.target <= 0) || currentMail.content === ''""
            :proxy-fn="sendNewMail"
            :label="'Send'" />
        </div>
      </div>
    </section>

    <section class="flex-grow flex flex-col text-[0.9rem]" v-if="currentView === 'replyView'">
      <div class="form">
        <div class="flex flex-row items-center gap-[5px] justify-between mb-2">
          <div class="font-semibold"> {{ currentMail?.subject }} </div>
          <div v-if="currentMail.timestamp" class="text-[#888]"> {{ readableDate(currentMail.timestamp) }}</div>
        </div>

        <textarea 
          class="w-full h-[12rem] bg-[#2a2a2a] text-[#f1f1f1] border border-[#444] mb-2 p-[0.50rem]"
          v-if="currentMail.source! > 0"
          v-model="replyContent"
          placeholder="Reply...">
        </textarea>

        <textarea 
          class="w-full h-[12rem] bg-[#2a2a2a] text-[#f1f1f1] border border-[#444] mb-2 p-[0.50rem] disabled:text-[#bbb]"
          disabled 
          :value="currentMail?.content"></textarea>


        <div class="flex flex-row items-center gap-[5px] justify-between">
          <ActionButton 
            :proxy-fn="back"
            :label="'Back'" />

          <div class="flex flex-row items-center gap-2">
            <ActionButton 
              :proxy-fn="deleteMail"
              :label="'Delete'" 
              :type="'warn'" />

            <ActionButton 
              v-if="currentMail.source! > 0"
              :proxy-fn="replyMail"
              :label="'Reply'" />
          </div>
        </div>
      </div>
    </section>

    <section>
      <div v-if="errorStr" class="error">{{ errorStr }}</div>
    </section>

  </main>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import _ from 'lodash';
import { API, APIWrapper } from '@/api/api';
import { MageRank, Mail } from 'shared/types/common';
import { useMageStore } from '@/stores/mage';
import { useRoute } from 'vue-router';
import ActionButton from './action-button.vue';
import { readableDate } from '@/util/util';
import { AutocompleteCandidate, BlackMarketId } from 'shared/src/common';
import Autocomplete from './autocomplete.vue';
import SvgIcon from './svg-icon.vue';

const mageStore = useMageStore();
const route = useRoute();

const currentView = ref('listView');
const targetMage = ref<AutocompleteCandidate | null>(null);

const replyContent = ref('');
const errorStr = ref('');

type NewMail = Partial<Mail>;

const blankMail: NewMail = {
  source: 0,
  target: 0,
  type: 'normal',
  priority: 100,
  subject: '',
  content: ''
};

const currentMail = ref<NewMail>(blankMail);

const mails = ref<Mail[]>([]);

const openMail = (mail: Mail) => {
  currentMail.value = mail;
  currentView.value = 'replyView';

  if (mail.read === false) {
    mail.read = true;
    API.post('/read-mails', { ids: [currentMail.value.id] });
  }
};


const setAutoComplete = (val: any) => {
  targetMage.value = val;
  currentMail.value.target = +targetMage.value!.id;
}
const searchMageRank = async (val: string) => {
  const results = await API.get<MageRank[]>(`/search-mage?searchStr=${val}`);
  return results.data.map(d => {
    return { 
      label: d.name, id: d.id.toString() 
    };
  });
}


const compose = async () => {
  currentView.value = 'composeView';
  currentMail.value = blankMail;

  currentMail.value.target = undefined;
  targetMage.value = null;
};

const back = async () => {
  currentView.value = 'listView';
};

const refreshMails = async () => {
  const results = await API.get<{ mails: Mail[]}>('/mails');
  mails.value = results.data.mails.sort((a, b) => b.timestamp - a.timestamp);
};

const _send = async (payload: NewMail) => {
  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    return API.post<{ id: string }>('/mails', { 
      mail: payload
    });
  });

  if (error) {
    errorStr.value = error;
  }

  if (data) {
    await refreshMails();
    currentView.value = 'listView';
  }
};

const _delete = async (ids: string[]) => {
  const { data, error } = await APIWrapper(() => {
    errorStr.value = '';
    return API.post<{ id: string }>('/delete-mails', { 
      ids: ids 
    });
  });

  if (error) {
    errorStr.value = error;
  }

  if (data) {
    await refreshMails();
    currentView.value = 'listView';
  }
};

const deleteMail = async () => {
  if (currentMail.value && currentMail.value.id) {
    await _delete([currentMail.value.id]);
  }
};

const deleteBM = async () => {
  const bmMailIds = mails.value.filter(m => m.source === BlackMarketId).map(m => m.id);
  await _delete(bmMailIds);
};

const markAllRead = async () => {
  const unread = mails.value.filter(m => m.read === false).map(m => m.id);
  if (unread.length > 0) {
    API.post('/read-mails', { ids: unread });
  }
  refreshMails();
};

const sendNewMail = async () => {
  // coerce
  currentMail.value.source = mageStore.mage!.id;
  currentMail.value.target = +currentMail.value.target!;
  await _send(currentMail.value);
};

const replyMail = async () => {
  if (replyContent.value === '') {
    errorStr.value = 'Content is empty';
    return;
  }

  let content = currentMail.value.content!;
  const lines = content.split(/\n/);
  content = '';

  for (const line of lines) {
    content = content + `~${line.trim()}\n`;
  }
  content = `${replyContent.value}\n\n${content}`;

  const replyMail: NewMail = {
    source: mageStore.mage!.id,
    target: currentMail.value.source,
    type: 'normal',
    priority: 100,

    subject: `RE: ${currentMail.value.subject}`,
    content: content
  };
  replyContent.value = '';
  await _send(replyMail);
};


onMounted(async () => {
  refreshMails();
  currentView.value = 'listView';

  if (route.query.target) {
    const m = (await API.get(`mage/${route.query.target}`)).data;
    if (!m) return;
    targetMage.value = {
      id: m.mageSummary.id,
      label: m.mageSummary.name
    };
    currentMail.value.target = +targetMage.value.id;
    currentView.value = 'composeView';
  }
});
</script>
