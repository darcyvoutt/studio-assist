<script>
import { defineAsyncComponent } from 'vue'
import { Key } from 'tonal'

// Utilities
import { formatFileSize } from '@/utils/files'
import { trimDecimals } from '@/utils/convert'
import { worker } from '@/utils/worker'
import { locale } from '@/utils/locale'

export default {
  components: {
    Alert: defineAsyncComponent(() => import('@/components/Alert.vue')),
    Arrow: defineAsyncComponent(() => import('@/icons/Arrow.vue')),
    Chevron: defineAsyncComponent(() => import('@/icons/Chevron.vue')),
    Clock: defineAsyncComponent(() => import('@/icons/Clock.vue')),
    Close: defineAsyncComponent(() => import('@/icons/Close.vue')),
    Document: defineAsyncComponent(() => import('@/icons/Document.vue')),
    Info: defineAsyncComponent(() => import('@/icons/Info.vue')),
    Loading: defineAsyncComponent(() => import('@/icons/Loading.vue')),
  },
  data() {
    return {
      active: false,
      autoupdate: true,
      duration: null,
      error: null,
      historyLimit: 10,
      historyShow: false,
      filename: null,
      filesize: 0,
      keyData: null,
      loading: false,
      measures: null,
      sampleRate: null,
      tempo: null,
      timestamp: null,
    }
  },
  computed: {
    audioConfigs() {
      return this.$store.getters.audioConfigs
    },
    file() {
      if (this.filename === null) return null
      return this.fileDetails({
        duration: this.duration,
        filename: this.filename,
        filesize: this.filesize,
        keyData: this.keyData,
        measures: this.measures,
        sampleRate: this.sampleRate,
        timestamp: this.timestamp,
      })
    },
    fileHistory() {
      return this.$store.getters.fileHistory
    },
    tempos() {
      if (this.tempo === null) return this.tempo
      return this.calcTempos(this.tempo)
    },
  },
  watch: {
    autoupdate(autoupdate) {
      this.updateSettings('autoupdate', autoupdate)
    },
  },
  mounted() {
    this.init()
    this.$refs.upload.focus()
  },
  methods: {
    init() {
      const files = { ...this.$store.state.settings.files }
      Object.keys(files).forEach((key) => (this[key] = files[key]))
    },
    calcTempos(tempo) {
      const rounded = Math.round(parseFloat(tempo))
      return {
        double: trimDecimals(rounded * 2, 0, false),
        standard: trimDecimals(rounded, 0, false),
        halftime: trimDecimals(rounded / 2, 0, false),
      }
    },
    dateTime() {
      const date = new Date()
      return `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`
    },
    fileDetails(file) {
      const toExtension = file.filename.lastIndexOf('.')
      const LUFS =
        file.measures.LUFS === null
          ? file.measures.LUFS
          : `${trimDecimals(file.measures.LUFS, 1)} LUFS`

      return {
        duration: file.duration,
        key: `${file.keyData.key} ${file.keyData.scale}`,
        keyName: file.keyData.key,
        keyScale: file.keyData.scale,
        LUFS: LUFS,
        name: file.filename.substring(0, toExtension),
        sampleRate: `${trimDecimals(file.sampleRate / 1000, 1)} kHz`,
        size: formatFileSize(file.filesize),
        timestamp: file.timestamp,
        type: file.filename.substring(toExtension + 1, file.filename.length),
      }
    },
    async fileCapture() {
      const files = this.$refs.file.files
      if (files.length === 0) return
      if (!files[0].type.includes('audio')) {
        this.error = locale('files.errors.none')
        return
      }
      const file = files[0]
      await this.process({ audioUrl: URL.createObjectURL(file), file })
      return
    },
    async process({ audioUrl, file }) {
      // Init
      this.error = null
      this.setLoading(true)

      const result = await worker({
        audioUrl: audioUrl,
        configs: this.audioConfigs,
        file: {
          name: file.name,
          size: `${file.size} (${formatFileSize(file.size)})`,
          type: file.type,
        },
      })

      if (!result.success) {
        this.error = result.error
        this.setLoading(false)
        return
      }

      // Update settings
      this.updateSettings('filename', file.name)
      this.updateSettings('filesize', file.size)
      this.updateSettings('duration', result.duration)
      this.updateSettings('keyData', result.keyData)
      this.updateSettings('measures', result.measures)
      this.updateSettings('tempo', result.tempo)
      this.updateSettings('sampleRate', result.sampleRate)
      this.updateSettings('timestamp', this.dateTime())

      if (this.autoupdate) {
        this.updateKey()
        this.updateTempo()
      }

      this.updateHistory()

      this.setLoading(false)

      return
    },
    relative(key, scale) {
      if (scale === 'major')
        return {
          key: Key.majorKey(key).minorRelative,
          scale: 'minor',
        }
      else
        return {
          key: Key.minorKey(key).relativeMajor,
          scale: 'major',
        }
    },
    setLoading(boolean) {
      this.loading = boolean
      this.$store.commit('setMenu', !boolean)
    },
    updateHistory() {
      // Get copy of current history
      let history = [...this.fileHistory]

      // History object
      const item = {
        showDetails: false,
        filename: this.filename,
        filesize: this.filesize,
        duration: this.duration,
        keyData: this.keyData,
        measures: this.measures,
        tempo: this.tempo,
        sampleRate: this.sampleRate,
        timestamp: this.timestamp,
      }

      // Put in first position & limit array length
      history.unshift(item)
      history = history.slice(0, this.historyLimit)

      // Update settings
      this.updateSettings('history', history)
    },
    updateKey(key = this.keyData.key, scale = this.keyData.scale) {
      this.$store.dispatch('updateSetting', {
        key: 'scales',
        value: {
          key: { value: key, text: key },
          name: {
            value: scale,
            text: locale(`scales.names.${scale}`),
          },
        },
      })

      this.$store.dispatch(
        'notify',
        locale('files.updated_key', { key, scale })
      )
    },
    updateSettings(key, value) {
      this.$store.dispatch('updateSetting', {
        key: 'files',
        value: { [key]: value },
      })
      this[key] = value
    },
    updateTempo(tempo = this.tempos.standard) {
      this.$store.dispatch('updateSetting', {
        key: 'milliseconds',
        value: { tempo },
      })

      this.$store.dispatch('notify', locale('files.updated', { tempo }))
    },
  },
}
</script>

<template>
  <section id="Files" class="w-screen h-screen">
    <template v-if="loading">
      <div class="flex flex-col justify-center items-center h-screen">
        <Loading label="files.loading" />
      </div>
    </template>

    <!-- Details -->
    <form
      v-if="!loading"
      class="w-full h-full flex items-center justify-center"
    >
      <div
        class="grid grid-cols-10 items-center w-full divide-x dark:divide-neutral-800"
      >
        <!-- File Info -->
        <div class="col-span-6">
          <!-- Title -->
          <div class="flex justify-center items-baseline gap-2 mb-6">
            <h1 class="title text-center">
              {{ $filters.locale('files.title') }}
            </h1>
            <div class="relative">
              <Info class="peer cursor-help" />
              <div class="hidden peer-hover:flex info-popover">
                <div>{{ $filters.locale('files.info') }}</div>
              </div>
            </div>
          </div>

          <div
            v-if="tempo !== null"
            class="flex flex-col items-center justify-center"
          >
            <!-- Result File -->
            <div
              class="flex items-center space-x-2.5 mt-2 mb-4 px-3 py-2 rounded-lg border border-scheme bg-neutral-100 dark:bg-neutral-800"
            >
              <span class="truncate max-w-md select-text">{{ file.name }}</span>
              <span class="pill-tertiary">{{ file.type }}</span>
            </div>

            <!-- Song Tempo & Key -->
            <div class="grid grid-cols-2 gap-x-3 w-3/5">
              <!-- Tempo -->
              <div class="file-result">
                <button
                  class="file-result-content hover:bg-tertiary hover:bg-opacity-80 group"
                  @click.prevent="updateTempo(tempos.standard)"
                >
                  <h3
                    class="text-left text-sm text-neutral-600 dark:text-neutral-400 font-medium uppercase"
                  >
                    <span>{{ $filters.locale('files.tempo') }}</span>
                  </h3>
                  <p class="flex items-baseline gap-0.5">
                    <span class="text-lg">{{ tempos.standard }}</span>
                    <span class="text-sm opacity-80">
                      {{ $filters.locale('general.bpm') }}
                    </span>

                    <Arrow
                      class="group-hover:scale-[1.18] transition-all self-center ml-0.5"
                      classes="h-[1.15rem] w-[1.15rem]"
                      direction="up"
                      type="circle"
                    />
                  </p>
                </button>

                <!-- Double & Half Time -->
                <div class="file-result-footer text-sm">
                  <div
                    class="grid grid-cols-2 divide-x divide-neutral-400 dark:divide-neutral-700 w-full h-full"
                  >
                    <button
                      class="flex justify-center items-center gap-x-0.5 hover:bg-tertiary hover:bg-opacity-80 group"
                      @click.prevent="updateTempo(tempos.halftime)"
                      :aria-label="$filters.locale('files.halftime')"
                    >
                      <Arrow
                        class="group-hover:scale-[120%] transition-all"
                        classes="h-3.5 w-3.5"
                        direction="up"
                        type="circle"
                      />
                      <span>
                        {{ $filters.locale('files.multiply.half') }}
                      </span>
                    </button>
                    <button
                      class="flex justify-center items-center gap-x-0.5 hover:bg-tertiary hover:bg-opacity-80 group"
                      @click.prevent="updateTempo(tempos.double)"
                      :aria-label="$filters.locale('files.double')"
                    >
                      <Arrow
                        class="group-hover:scale-[120%] transition-all"
                        classes="h-3.5 w-3.5"
                        direction="up"
                        type="circle"
                      />
                      <span>
                        {{ $filters.locale('files.multiply.double') }}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Song Key -->
              <div class="file-result">
                <button
                  class="file-result-content hover:bg-tertiary hover:bg-opacity-80 group"
                  @click.prevent="updateKey(file.keyName, file.keyScale)"
                >
                  <h3
                    class="left text-sm text-neutral-600 dark:text-neutral-400 font-medium uppercase"
                  >
                    {{ $filters.locale('files.song_key') }}
                  </h3>
                  <div
                    class="flex items-baseline gap-0.5"
                  >
                    <span class="text-xl">{{ file.keyName }}</span>
                    <span class="text-md">{{ file.keyScale }}</span>
                    <Arrow
                      class="group-hover:scale-[1.18] transition-all self-center ml-0.5"
                      classes="h-[1.15rem] w-[1.15rem]"
                      direction="up"
                      type="circle"
                    />
                  </div>
                </button>

                <div class="file-result-footer">
                  <button
                    @click.prevent="
                      updateKey(
                        relative(file.keyName).key,
                        relative(file.keyScale).scale
                      )
                    "
                    class="w-full h-full py-1.5 flex justify-center items-center gap-2 hover:bg-tertiary hover:bg-opacity-80 group"
                  >
                    <Arrow
                      class="group-hover:scale-110 transition-all"
                      classes="h-5 w-5"
                      direction="up"
                      type="circle"
                    />
                    <span class="flex items-baseline gap-1">
                      <span class="text-lg">
                        {{ relative(file.keyName).key }}
                      </span>
                      <span class="text-sm">
                        {{ relative(file.keyScale).scale }}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- File Info -->
            <ul
              class="flex items-center gap-2 mt-4 opacity-60 hover:opacity-100 select-text"
            >
              <li class="pill-neutral-outline">
                {{ file.duration }}
              </li>
              <li class="pill-neutral-outline">{{ file.size }}</li>
              <li class="pill-neutral-outline">
                {{ file.sampleRate }}
              </li>
              <li
                v-if="file.LUFS !== null"
                class="pill-neutral-outline"
              >
                {{ file.LUFS }}
              </li>
            </ul>

            <!-- History Button -->
            <div v-if="fileHistory.length > 0" class="pt-4 pb-6">
              <button
                class="flex items-center gap-x-1.5 opacity-80 dark:opacity-60 hover:opacity-100 transition-opacity text-sm select-none"
                @click.prevent="historyShow = !historyShow"
              >
                <span class="border-b pb-0.5">
                  {{ $filters.locale('files.history') }}
                </span>
                <Chevron v-if="!historyShow" direction="down" />
                <Chevron v-if="historyShow" direction="up" />
              </button>
            </div>

            <!-- History -->
            <ul
              class="col-span-full overflow-y-auto pr-4 pl-12 rounded-lg transition-all"
              :class="{
                'h-56': historyShow,
                'h-0': !historyShow,
              }"
            >
              <li
                v-for="(file, index) in fileHistory"
                class="grid grid-cols-7 gap-x-6 border-b border-dashed border-neutral-300 dark:border-neutral-700 last-of-type:border-none pb-3 mb-3 last-of-type:mb-0"
                :key="index"
              >
                <!-- Left Column: File Info -->
                <div class="col-span-4 flex flex-col gap-1 pt-1">
                  <!-- Filename -->
                  <div
                    class="truncate text-sm"
                  >
                    {{ fileDetails(file).name }}
                  </div>

                  <!-- Timestamp & Toggle -->
                  <button
                    class="flex items-center gap-x-1 opacity-50 text-xs"
                    @click.prevent="file.showDetails = !file.showDetails"
                  >
                    <Clock classes="h-4 w-4" />
                    <span>{{ fileDetails(file).timestamp }}</span>
                    <Chevron
                      v-if="!file.showDetails"
                      classes="h-4 w-4"
                      direction="down"
                    />
                    <Chevron
                      v-if="file.showDetails"
                      classes="h-4 w-4"
                      direction="up"
                    />
                  </button>

                  <!-- Extra Details -->
                  <ul
                    class="flex items-center gap-x-1.5 mt-1 overflow-hidden transition-all select-text"
                    :class="{
                      'h-6': file.showDetails,
                      'h-0': !file.showDetails,
                    }"
                  >
                    <li class="pill-neutral-outline pill-xs">
                      {{ fileDetails(file).duration }}
                    </li>
                    <li class="pill-neutral-outline pill-xs">
                      {{ fileDetails(file).size }}
                    </li>
                    <li class="pill-neutral-outline pill-xs">
                      {{ fileDetails(file).sampleRate }}
                    </li>
                    <li
                      class="pill-neutral-outline pill-xs"
                      v-if="fileDetails(file).LUFS !== null"
                    >
                      {{ fileDetails(file).LUFS }}
                    </li>
                  </ul>
                </div>

                <!-- Right Column: Action Buttons -->
                <div class="col-span-3 flex flex-col font-medium">
                  <div class="grid grid-cols-2 gap-x-1.5 items-center">
                    <!-- Tempos -->
                    <div class="col-span-1">
                      <div
                        class="grid grid-cols-2 overflow-hidden text-sm rounded-md border border-scheme divide-y divide-scheme"
                      >
                        <!-- Main Tempo -->
                        <div class="col-span-full">
                          <button
                            @click.prevent="
                              updateTempo(calcTempos(file.tempo).standard)
                            "
                            class="flex items-center justify-center w-full gap-1 py-1 hover:bg-tertiary hover:text-white"
                          >
                            <span>{{ calcTempos(file.tempo).standard }}</span>
                            <span>{{ $filters.locale('general.bpm') }}</span>
                            <Arrow
                              classes="h-4 w-4"
                              class="ml-0.5"
                              direction="up"
                              type="circle"
                            />
                          </button>
                        </div>

                        <!-- Double -->
                        <div>
                          <button
                            :aria-label="$filters.locale('files.halftime')"
                            @click.prevent="
                              updateTempo(calcTempos(file.tempo).halftime)
                            "
                            class="flex items-center justify-center w-full gap-[0.1rem] py-1 text-xs hover:bg-tertiary hover:text-white"
                          >
                            <Arrow
                              classes="h-3 w-3"
                              direction="up"
                              type="circle"
                            />
                            <span>
                              {{ $filters.locale('files.multiply.half') }}
                            </span>
                          </button>
                        </div>

                        <!-- Half Time -->
                        <div class="border-l">
                          <button
                            :aria-label="$filters.locale('files.double')"
                            @click.prevent="
                              updateTempo(calcTempos(file.tempo).double)
                            "
                            class="flex items-center justify-center w-full gap-[0.1rem] py-1 text-xs hover:bg-tertiary hover:text-white"
                          >
                            <Arrow
                              classes="h-3 w-3"
                              direction="up"
                              type="circle"
                            />
                            <span>
                              {{ $filters.locale('files.multiply.double') }}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Key -->
                    <div class="col-span-1 flex gap-1.5">
                      <button
                        class="flex flex-col justify-center items-center rounded-lg border border-scheme py-1 px-2 hover:bg-tertiary hover:text-white"
                        @click.prevent="updateKey(file.keyName, file.keyScale)"
                      >
                        <div class="flex items-center gap-0.5 text-2xl -mb-1">
                          <span>{{ file.keyData.key }}</span>
                          <Arrow
                            classes="h-4 w-4"
                            direction="up"
                            type="circle"
                          />
                        </div>
                        <span class="text-sm">{{ file.keyData.scale }}</span>
                      </button>

                      <button
                        class="flex flex-col justify-center items-center rounded-lg border border-scheme py-1 px-2 hover:bg-tertiary hover:text-white"
                        @click.prevent="
                          updateKey(
                            relative(file.keyName).key,
                            relative(file.keyScale).scale
                          )
                        "
                      >
                        <div class="flex items-center gap-0.5 text-2xl -mb-1">
                          <span>{{ relative(file.keyData.key).key }}</span>
                          <Arrow
                            classes="h-4 w-4"
                            direction="up"
                            type="circle"
                          />
                        </div>
                        <span class="text-sm">
                          {{ relative(file.keyData.scale).scale }}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- File Upload -->
        <div class="col-span-4">
          <!-- Upload Form -->
          <div
            id="UploadFile"
            class="p-5 border-primary-interactive border-dashed rounded-lg"
            :class="{
              'border bg-primary-interactive/[0.06]': active,
              'border-transparent': !active,
            }"
          >
            <Alert
              v-if="error !== null"
              :message="error"
              type="critical"
              class="mb-3"
            />

            <div class="mb-3 flex justify-center">
              <button
                ref="upload"
                type="button"
                class="btn"
                :class="{ 'opacity-60': active }"
                @click.prevent="$refs.file.click()"
              >
                {{ $filters.locale('files.upload') }}
              </button>

              <input
                ref="file"
                type="file"
                accept="audio/*"
                @change="fileCapture()"
                class="sr-only"
              />
            </div>

            <div class="flex items-center justify-center space-x-2">
              <input
                id="autoupdate"
                type="checkbox"
                name="autoupdate"
                v-model="autoupdate"
                :unchecked-value="false"
                :value="true"
              />
              <label for="autoupdate" class="text-base dark:text-neutral-50">
                {{ $filters.locale('files.autoupdate') }}
              </label>
            </div>

            <div class="text-xs text-center mt-2 text-neutral-400">
              {{ $filters.locale('files.support') }}
            </div>
          </div>
        </div>
      </div>
    </form>
  </section>
</template>
