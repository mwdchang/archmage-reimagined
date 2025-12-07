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
          <input type="text" placeholder="subject..."/>
        </div>
        <textarea
          style="width: 95%; height: 8rem" 
          placeholder="content..."></textarea>

        <div class="row" style="gap: 2">
          <ActionButton 
            :proxy-fn="back"
            :label="'Back'" />

          <ActionButton 
            :proxy-fn="back"
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
        <div class="message-content" id="messageContent">
          {{ currentMail?.content }}
        </div>

        <textarea style="width: 95%; height: 8rem" 
          placeholder="Reply...">
        </textarea>

        <div class="row" style="gap: 2">
          <ActionButton 
            :proxy-fn="back"
            :label="'Back'" />

          <ActionButton 
            :proxy-fn="back"
            :label="'Reply'" />
        </div>
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { API } from '@/api/api';
import { Mail } from 'shared/types/common';
import { onMounted, ref } from 'vue';
import ActionButton from './action-button.vue';

const viewPane = ref<HTMLElement>();
const composePane = ref<HTMLElement>();
const listPane = ref<HTMLElement>();

const currentMail = ref<Omit<Mail, 'id' | 'read' | 'timestamp'>>({
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

const sendMail = async () => {
  const result = await API.post<{ id: string; errors: any[] }>('/mails', { mail: currentMail });

  if (listPane.value && viewPane.value && composePane.value) {
    listPane.value.style.display = 'flex';
    composePane.value.style.display = 'none'
    viewPane.value.style.display = 'none';
  }
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
