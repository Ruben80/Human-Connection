<template>
  <vue-dropzone
    :options="dropzoneOptions"
    ref="el"
    id="postdropzone"
    class="ds-card-image"
    :use-custom-slot="true"
    @vdropzone-error="verror"
    @vdropzone-thumbnail="transformImage"
  >
    <div class="crop-overlay" ref="cropperOverlay" v-show="showCropper">
      <base-button @click="cropImage" class="crop-confirm" filled>
        {{ $t('contribution.teaserImage.cropperConfirm') }}
      </base-button>
      <base-button
        class="crop-cancel"
        icon="close"
        size="small"
        circle
        danger
        filled
        @click="cancelCrop"
      />
    </div>
    <div
      :class="{
        'hc-attachments-upload-area-post': true,
        'hc-attachments-upload-area-update-post': contribution,
      }"
    >
      <slot></slot>
      <div
        :class="{
          'hc-drag-marker-post': true,
          'hc-drag-marker-update-post': contribution,
        }"
      >
        <base-icon name="image" />
      </div>
    </div>
  </vue-dropzone>
</template>

<script>
import vueDropzone from 'nuxt-dropzone'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

export default {
  components: {
    vueDropzone,
  },
  props: {
    contribution: { type: Object, default: () => {} },
  },
  data() {
    return {
      dropzoneOptions: {
        url: () => '',
        maxFilesize: 5.0,
        previewTemplate: this.template(),
      },
      image: null,
      file: null,
      editor: null,
      cropper: null,
      thumbnailElement: null,
      oldImage: null,
      error: false,
      showCropper: false,
      imageAspectRatio: null,
    }
  },
  methods: {
    template() {
      return `<div class="dz-preview dz-file-preview">
                <div class="dz-image">
                  <div data-dz-thumbnail-bg></div>
                </div>
              </div>
	     `
    },
    verror(file, message) {
      this.error = true
      this.$toast.error(file.status, message)
      setTimeout(() => {
        this.error = false
      }, 2000)
    },
    transformImage(file) {
      this.file = file
      this.$emit('cropInProgress', true)
      this.showCropper = true
      this.initEditor()
      this.initCropper()
    },
    initEditor() {
      this.editor = this.$refs.cropperOverlay
      this.clearImages()
      this.thumbnailElement.appendChild(this.editor)
    },
    clearImages() {
      this.thumbnailElement = document.querySelectorAll('#postdropzone')[0]
      const thumbnailPreview = document.querySelectorAll('.thumbnail-preview')[0]
      if (thumbnailPreview) thumbnailPreview.remove()
      const contributionImage = document.querySelectorAll('.contribution-image')[0]
      this.oldImage = contributionImage
      if (contributionImage) contributionImage.remove()
    },
    deleteImage() {
      this.clearImages()
    },
    initCropper() {
      this.image = new Image()
      this.image.src = URL.createObjectURL(this.file)
      this.editor.appendChild(this.image)
      this.cropper = new Cropper(this.image, { zoomable: false, autoCropArea: 0.9 })
    },
    cropImage() {
      this.showCropper = false
      if (this.file.type === 'image/jpeg') {
        this.uploadJpeg()
      } else {
        this.uploadOtherImageType()
      }
    },
    uploadOtherImageType() {
      this.imageAspectRatio = this.file.width / this.file.height || 1.0
      this.image = new Image()
      this.image.src = this.file.dataURL
      this.setupPreview()
      this.emitImageData(this.file)
    },
    uploadJpeg() {
      const canvas = this.cropper.getCroppedCanvas()
      canvas.toBlob(blob => {
        this.imageAspectRatio = canvas.width / canvas.height
        this.image = new Image()
        this.image.src = canvas.toDataURL()
        this.setupPreview()
        const croppedImageFile = new File([blob], this.file.name, { type: this.file.type })
        this.emitImageData(croppedImageFile)
      }, 'image/jpeg')
    },
    setupPreview() {
      this.image.classList.add('thumbnail-preview')
      this.thumbnailElement.appendChild(this.image)
    },
    cancelCrop() {
      if (this.oldImage) this.thumbnailElement.appendChild(this.oldImage)
      this.showCropper = false
      this.$emit('cropInProgress', false)
    },
    emitImageData(imageFile) {
      this.$emit('addTeaserImage', imageFile)
      this.$emit('addImageAspectRatio', this.imageAspectRatio)
      this.$emit('cropInProgress', false)
    },
  },
}
</script>
<style lang="scss">
#postdropzone {
  width: 100%;
  min-height: 400px;
  background-color: $background-color-softest;
}

.hc-attachments-upload-area-post {
  position: relative;
  display: flex;
  justify-content: center;
  cursor: pointer;
}

.hc-attachments-upload-area-update-post img {
  object-fit: cover;
  object-position: center;
  display: block;
  width: 100%;
}

.hc-attachments-upload-area-update-post:hover {
  opacity: 0.7;
}

.hc-drag-marker-post {
  position: absolute;
  width: 122px;
  height: 122px;
  border-radius: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 180px 5px;
  color: hsl(0, 0%, 25%);
  transition: all 0.2s ease-out;
  font-size: 60px;
  background-color: $background-color-softest;
  opacity: 0.65;

  &:before {
    position: absolute;
    content: '';
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    border-radius: 100%;
    border: 20px solid $text-color-base;
    visibility: hidden;
  }

  &:after {
    position: absolute;
    content: '';
    top: 10px;
    left: 10px;
    bottom: 10px;
    right: 10px;
    border-radius: 100%;
    border: $border-size-base dashed $text-color-base;
  }

  .hc-attachments-upload-area-post:hover & {
    opacity: 1;
  }
}

.hc-drag-marker-update-post {
  opacity: 0.1;
}

.contribution-form-footer {
  border-top: $border-size-base solid $border-color-softest;
}

.crop-overlay {
  max-height: 2000px;
  position: relative;
  width: 100%;
  background-color: #000;
}

.crop-confirm {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 1;
}
.crop-cancel {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 1;
}
</style>
