<template>
  <main style="display: flex; flex-direction: column; gap: 10">

    <section class="form"> 
      <div class="row" style="gap: 5">
        <ActionButton 
          :proxy-fn="compose"
          :label="'Compose'" />

        <!--
        <ActionButton 
          :proxy-fn="back"
          :label="'Delete BM'" />
        -->
      </div>
    </section>

    <section class="message-list-pane" ref="composePane">
      <div class="form" v-if="currentMail">
        <div class="row" style="align-items: baseline; gap: 5">
          <input type="text" placeholder="Sending to" v-model="currentMail.target" style="width: 15rem" />
        </div>

        <div class="row" style="align-items: baseline; gap: 5">
          <input type="text" placeholder="subject..." v-model="currentMail.subject" />
        </div>
        <textarea
          v-model="currentMail.content"
          style="width: 95%; height: 8rem" 
          placeholder="content..."></textarea>

        <div class="row" style="gap: 2">
          <ActionButton 
            :proxy-fn="back"
            :label="'Back'" />

          <ActionButton 
            :proxy-fn="newMail"
            :label="'Send'" />
        </div>
      </div>
    </section>

    <section class="message-list-pane" ref="listPane">
      <h3>Messages</h3>
      <div class="message-list" id="messageList">
        <div v-for="message of mails" 
          class="message-item"
          @click="openMail(message)">
          {{ message.subject }}
        </div>
        <div v-if="mails.length === 0">
          You have no messages
        </div>
      </div>
    </section>

    <section class="message-view-pane" ref="viewPane">
      <div class="form">
        <div style="font-weight: 600"> {{ currentMail?.subject }} </div>

        <!--
        <div class="message-content" id="messageContent">
          {{ currentMail?.content }}
        </div>
        -->

        <textarea style="width: 95%; height: 7rem" disabled 
          :value="currentMail?.content"></textarea>


        <textarea style="width: 95%; height: 8rem" 
          v-model="replyContent"
          placeholder="Reply...">
        </textarea>

        <div class="row" style="gap: 2">
          <ActionButton 
            :proxy-fn="back"
            :label="'Back'" />

          <ActionButton 
            :proxy-fn="replyMail"
            :label="'Reply'" />
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
import { API, APIWrapper } from '@/api/api';
import { Mail } from 'shared/types/common';
import { useMageStore } from '@/stores/mage';
import ActionButton from './action-button.vue';
import { error } from 'console';

const mageStore = useMageStore();

const viewPane = ref<HTMLElement>();
const composePane = ref<HTMLElement>();
const listPane = ref<HTMLElement>();

const replyContent = ref('');
const errorStr = ref('');

type NewMail = Omit<Mail, 'id' | 'read' | 'timestamp'>;

const currentMail = ref<NewMail>({
  source: 0,
  target: 0,
  type: 'normal',
  priority: 100,

  subject: '',
  content: ''
});

const mails = ref<Mail[]>([]);

// Static placeholder messages
// const messages: Mail[] = [
//   {
//     id: '1',
//     type: 'normal',
//     priority: 50,
//     timestamp: Date.now(),
//     source: 0,
//     target: 1,
//     subject: "Your delivery has arrived",
//     content: "Your shipment of iron and wood is ready for pickup at the docks.",
//     read: false
//   },
//   {
//     id: '2',
//     type: 'normal',
//     priority: 50,
//     timestamp: Date.now(),
//     source: 0,
//     target: 1,
//     subject: "New quest available",
//     content: "A new quest has appeared: 'Defend the Village'. Rewards await!",
//     read: false
//   },
//   {
//     id: '3',
//     type: 'normal',
//     priority: 50,
//     timestamp: Date.now(),
//     source: 0,
//     target: 1,
//     subject: "Battle Invitation",
//     content: "You have been invited to fight in the next arena challenge.",
//     read: false
//   }
// ];

const openMail = (mail: Mail) => {
  currentMail.value = mail;
  if (listPane.value && viewPane.value && composePane.value) {
    listPane.value.style.display = 'none';
    composePane.value.style.display = 'none'
    viewPane.value.style.display = 'flex';
  }
};

const compose = async () => {
  if (listPane.value && viewPane.value && composePane.value) {
    listPane.value.style.display = 'none';
    composePane.value.style.display = 'flex'
    viewPane.value.style.display = 'none';
  }
};

const back = async () => {
  if (listPane.value && viewPane.value && composePane.value) {
    listPane.value.style.display = 'flex';
    composePane.value.style.display = 'none'
    viewPane.value.style.display = 'none';
  }
};

const refreshMails = async () => {
  const results = await API.get<{ mails: Mail[]}>('/mails');
  mails.value = results.data.mails;
};

const send = async (payload: NewMail) => {
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
    if (listPane.value && viewPane.value && composePane.value) {
      listPane.value.style.display = 'flex';
      composePane.value.style.display = 'none'
      viewPane.value.style.display = 'none';
    }
  }
};

const newMail = async () => {
  // coerce
  currentMail.value.source = mageStore.mage!.id;
  currentMail.value.target = +currentMail.value.target;
  await send(currentMail.value);
};

const replyMail = async () => {
  if (replyContent.value === '') {
    errorStr.value = 'Content is empty';
    return;
  }

  let content = currentMail.value.content;
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

  console.log('...............', content);

  replyContent.value = '';
  await send(replyMail);
};

onMounted(() => {
  refreshMails();
  if (listPane.value && viewPane.value && composePane.value) {
    listPane.value.style.display = 'flex';
    composePane.value.style.display = 'none'
    viewPane.value.style.display = 'none';
  }
});
</script>

<style scoped>
main {
  /* FIXME: mobile */
  min-width: 30rem
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
  display: none;
  flex-direction: column;
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
</style>
