<template>
  <main style="display: flex; flex-direction: row">
    <!-- left pane -->
    <section class="message-list-pane" id="messageListPane">
      <div class="message-list" id="messageList">
        <div v-for="message of messages" 
          class="message-item"
          @click="openMail(message)">
          {{ message.subject }}
        </div>
      </div>
    </section>

    <!-- right pane -->
    <section class="message-view-pane" id="messageViewPane">
      <div> 
      </div>
      <div class="message-content" id="messageContent">
        {{ currentMail?.content }}
      </div>

      <div class="form">
        <textarea style="width: 90%; height: 8rem" 
          placeholder="Reply...">
        </textarea>

        <div class="row" style="gap: 2">
          <button @click="back">← Back</button>
          <button class="send-btn">Send </button>
        </div>
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { Mail } from 'shared/types/common';
import { onMounted, ref } from 'vue';
import ActionButton from './action-button.vue';

const currentMail = ref<Mail>();


// Static placeholder messages
const messages: Mail[] = [
  {
    id: '1',
    type: 'normal',
    priority: 50,
    timestamp: Date.now(),
    source: 0,
    target: 1,
    subject: "Your delivery has arrived",
    content: "Your shipment of iron and wood is ready for pickup at the docks.",
    read: false
  },
  {
    id: '2',
    type: 'normal',
    priority: 50,
    timestamp: Date.now(),
    source: 0,
    target: 1,
    subject: "New quest available",
    content: "A new quest has appeared: 'Defend the Village'. Rewards await!",
    read: false
  },
  {
    id: '3',
    type: 'normal',
    priority: 50,
    timestamp: Date.now(),
    source: 0,
    target: 1,
    subject: "Battle Invitation",
    content: "You have been invited to fight in the next arena challenge.",
    read: false
  }
];


const mobileStyle = ref<any>({});

const openMail = (mail: Mail) => {
  currentMail.value = mail;
  document.getElementById('messageListPane')!.style.display = "none";
  document.getElementById('messageViewPane')!.style.display = "flex";
};

const back = () => {
  document.getElementById('messageListPane')!.style.display = "flex";
  document.getElementById('messageViewPane')!.style.display = "none";
};

onMounted(() => {});


// Back button (mobile)
// backButton.addEventListener("click", () => {
//     messageViewPane.style.display = "none";
//     messageListPane.style.display = "block";
// });
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
  background: #f0f0f0;
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


.send-btn:hover {
  background: #0069d9;
}

/* MOBILE RESPONSIVE MODE */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }

  .message-list-pane {
    width: 100%;
    height: 100vh;
  }

  .message-view-pane {
    width: 100%;
    height: 100vh;
    display: none;
    background: white;
  }

  .mobile-only {
    display: block;
  }
}
</style>
