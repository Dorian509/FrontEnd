<template>
  <section>
    <h2>Benutzerliste</h2>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </section>
</template>

<script setup>
const users = [
  { id: 1, name: 'Anna' },
  { id: 2, name: 'Ben' },
  { id: 3, name: 'Chris' }
]
</script>
