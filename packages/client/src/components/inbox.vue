<template>
  <main style="display: flex; flex-direction: column; gap: 10">

    <section class="form"> 
      <div class="row" style="justify-content: space-between">
        <ActionButton 
          :proxy-fn="compose"
          :label="'Compose'" />

        <ActionButton 
          v-if="currentView === 'listView'"
          :proxy-fn="deleteBM"
          :type="'warn'"
          :label="'Delete BM'" />

      </div>
    </section>

    <section class="message-list-pane" v-if="currentView === 'listView'">
      <h3>Messages</h3>
      <div class="message-list" id="messageList">
        <div v-for="message of mails" 
          :key="message.id"
          class="message-item"
          @click="openMail(message)">
          <div class="row" style="justify-content:space-between" :class="{ 'unread': message.read === false}">
            <div :class="{ 'unread': message.read === false }"> {{ message.subject }}</div>
            <div :class="{ 'unread': message.read === false }" style="color: #888; font-size: 0.75rem"> {{ readableDate(message.timestamp) }}</div>
          </div>
        </div>
        <div v-if="mails.length === 0">
          You have no messages
        </div>
      </div>
    </section>

    <section class="message-list-pane" v-if="currentView === 'composeView'">
      <div class="form" v-if="currentMail">
        <div class="row" style="align-items: baseline; gap: 1.0rem">
          <input type="text" placeholder="Sending to" 
            @blur="checkMage"
            @input="debounceCheckmage"
            v-model="currentMail.target" style="width: 8rem" />
          <span v-if="targetMage">
            {{ targetMage.name }} (#{{targetMage.id}} )
          </span>
        </div>

        <div class="row" style="align-items: baseline; gap: 5">
          <input type="text" placeholder="subject..." v-model="currentMail.subject" />
        </div>
        <textarea
          v-model="currentMail.content"
          style="width: 100%; height: 10rem" 
          placeholder="content..."></textarea>

        <div class="row" style="gap: 2; justify-content: space-between;">
          <ActionButton 
            :proxy-fn="back"
            :label="'Back'" />

          <ActionButton 
            :proxy-fn="sendNewMail"
            :label="'Send'" />
        </div>
      </div>
    </section>

    <section class="message-view-pane" v-if="currentView === 'replyView'">
      <div class="form">
        <div class="row" style="justify-content:space-between">
          <div style="font-weight: 600"> {{ currentMail?.subject }} </div>
          <div v-if="currentMail.timestamp" style="color: #888"> {{ readableDate(currentMail.timestamp) }}</div>
        </div>

        <textarea style="width: 100%; height: 8rem" 
          v-model="replyContent"
          placeholder="Reply...">
        </textarea>

        <textarea style="width: 100%; height: 7rem; background: #555; color: #eee" disabled 
          :value="currentMail?.content"></textarea>


        <div class="row" style="justify-content:space-between">
          <ActionButton 
            :proxy-fn="back"
            :label="'Back'" />

          <div class="row" style="gap: 0.5rem">
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
import { Mail } from 'shared/types/common';
import { useMageStore } from '@/stores/mage';
import ActionButton from './action-button.vue';
import { readableDate } from '@/util/util';
import { MageSummary } from 'shared/types/mage';
import { BlackMarketId } from 'shared/src/common';

const mageStore = useMageStore();

const currentView = ref('listView');
const targetMage = ref<MageSummary>();

const replyContent = ref('');
const errorStr = ref('');

type NewMail = Partial<Mail>;

const currentMail = ref<NewMail>({
  source: 0,
  target: 0,
  type: 'normal',
  priority: 100,

  subject: '',
  content: ''
});

const mails = ref<Mail[]>([]);

const openMail = (mail: Mail) => {
  currentMail.value = mail;
  currentView.value = 'replyView';

  if (mail.read === false) {
    mail.read = true;
    API.post('/read-mails', { ids: [currentMail.value.id] });
  }
};

const compose = async () => {
  currentView.value = 'composeView';
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

const checkMage = async () => {
  const id = currentMail.value.target;
  const res = await API.get<{ mageSummary: MageSummary }>(`/mage/${id}`);

  if (res.data && res.data.mageSummary) {
    targetMage.value = res.data.mageSummary;
  }
};

const debounceCheckmage = _.debounce(checkMage, 300);


onMounted(() => {
  refreshMails();
  currentView.value = 'listView';
});
</script>

<style scoped>
main {
  /* FIXME: mobile */
  min-width: 35rem
}

.mobile-only {
  display: none;
}

/* LEFT PANE */
.message-list-pane {
  width: 100%;
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

.message-list {
  overflow-y: auto;
  flex-grow: 1;
}

.message-item {
  padding: 0.20rem;
  border-bottom: 1px solid #888;
  cursor: pointer;
}

.message-item:hover {
  background: #505050;
}

.message-item.active {
  background: #dfeeff;
}

.message-view-pane {
  flex-grow: 2;
  /* display: flex; */
  display: flex;
  flex-direction: column;
  font-size: 0.9rem;
}

.message-content {
  padding: 16px;
  overflow-y: auto;
  flex-grow: 1;
}

.reply-box {
  border-top: 1px solid #ccc;
  padding: 10px;
  background: #fff;
  display: flex;
  gap: 10px;
}

.reply-box textarea {
  flex-grow: 1;
  resize: none;
  height: 80px;
  padding: 8px;
}

.unread {
  font-weight: 600;
  background: #333;
}
</style>
