import { PlusOutlined } from "@ant-design/icons"
import { App, Typography, Upload } from "antd"
import type { UploadFile } from "antd"
import type { CSSProperties } from "react"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { readFileAsDataURL } from "@/lib/readFileAsDataURL"

const ACCEPT = "image/png,image/jpeg,image/webp"

type Draft =
  | { kind: "unchanged" }
  | { kind: "removed" }
  | { kind: "pending"; file: File; previewUrl: string }

export type ProfilePhotoFieldHandle = {
  /** Value to persist when the settings form is submitted. */
  getValueForSave: () => Promise<string | undefined>
  /** Discard local edits and show `savedUrl` again. */
  reset: () => void
}

type ProfilePhotoFieldProps = {
  savedUrl: string | undefined
  /**
   * `settings` — วงกลม picture-circle ขนาดใหญ่ ข้อความกลางคอลัมน์ ไม่มีกรอม/พื้นหลังการ์ดสี่เหลี่ยมรอบนอก
   * `default` — วงกลม picture-circle แบบเดิม (มีการ์ดรอบนอก)
   */
  variant?: "default" | "settings"
}

function isAcceptedImage(file: File) {
  return ACCEPT.split(",").some((t) => file.type === t.trim())
}

/** ใช้กับโหมด settings — ขนาดวงกลมก่อน/หลังอัปโหลดให้เท่ากัน (ผ่าน CSS variable `--settings-avatar`) */
const SETTINGS_AVATAR_VALUE = "min(220px, 70vw)"

export const ProfilePhotoField = forwardRef<ProfilePhotoFieldHandle, ProfilePhotoFieldProps>(
  function ProfilePhotoField({ savedUrl, variant = "default" }, ref) {
    const { message } = App.useApp()
    const [draft, setDraft] = useState<Draft>({ kind: "unchanged" })
    const isSettings = variant === "settings"

    const draftRef = useRef(draft)
    draftRef.current = draft

    const savedUrlRef = useRef(savedUrl)
    savedUrlRef.current = savedUrl

    const revokePending = useCallback((d: Draft) => {
      if (d.kind === "pending") URL.revokeObjectURL(d.previewUrl)
    }, [])

    useEffect(
      () => () => {
        revokePending(draftRef.current)
      },
      [revokePending],
    )

    const fileList: UploadFile[] = useMemo(() => {
      if (draft.kind === "pending") {
        return [
          {
            uid: "profile-draft",
            name: draft.file.name || "avatar",
            status: "done",
            url: draft.previewUrl,
          },
        ]
      }
      if (draft.kind === "unchanged" && savedUrl) {
        return [
          {
            uid: "profile-saved",
            name: "profile",
            status: "done",
            url: savedUrl,
          },
        ]
      }
      return []
    }, [draft, savedUrl])

    const applyFile = useCallback(
      (file: File) => {
        if (!isAcceptedImage(file)) {
          message.warning("ใช้ได้เฉพาะ PNG, JPG, หรือ WEBP")
          return
        }
        setDraft((prev) => {
          revokePending(prev)
          return {
            kind: "pending",
            file,
            previewUrl: URL.createObjectURL(file),
          }
        })
      },
      [message, revokePending],
    )

    const clearImage = useCallback(() => {
      setDraft((prev) => {
        revokePending(prev)
        return { kind: "removed" }
      })
    }, [revokePending])

    const reset = useCallback(() => {
      setDraft((prev) => {
        revokePending(prev)
        return { kind: "unchanged" }
      })
    }, [revokePending])

    useImperativeHandle(
      ref,
      () => ({
        reset,
        getValueForSave: async () => {
          const d = draftRef.current
          if (d.kind === "pending") return readFileAsDataURL(d.file)
          if (d.kind === "removed") return undefined
          return savedUrlRef.current
        },
      }),
      [reset],
    )

    const uploadClassName = [
      "[&_.ant-upload]:border-slate-200/90 [&_.ant-upload-select]:bg-white",
      isSettings
        ? [
            // วงกลมตัวเลือก (ก่อนอัปโหลด)
            "[&_.ant-upload-select-picture-circle]:!h-[var(--settings-avatar)] [&_.ant-upload-select-picture-circle]:!w-[var(--settings-avatar)]",
            "[&_.ant-upload-select-picture-circle]:!min-h-[var(--settings-avatar)] [&_.ant-upload-select-picture-circle]:!min-w-[var(--settings-avatar)]",
            "[&_.ant-upload-select-picture-circle]:!rounded-full [&_.ant-upload-select-picture-circle]:!overflow-hidden",
            // วงหลังอัปโหลด — กล่องครอบ + รายการ + รูป ให้เท่ากับตัวเลือก
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item-container]:!h-[var(--settings-avatar)] [&_.ant-upload-list-picture-circle_.ant-upload-list-item-container]:!w-[var(--settings-avatar)]",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!h-[var(--settings-avatar)] [&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!w-[var(--settings-avatar)]",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!min-h-[var(--settings-avatar)] [&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!min-w-[var(--settings-avatar)]",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!max-h-[var(--settings-avatar)] [&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!max-w-[var(--settings-avatar)]",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!rounded-full [&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!overflow-hidden",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!flex [&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!items-center [&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!justify-center",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item-thumbnail]:!m-0 [&_.ant-upload-list-picture-circle_.ant-upload-list-item-thumbnail]:!h-full [&_.ant-upload-list-picture-circle_.ant-upload-list-item-thumbnail]:!w-full [&_.ant-upload-list-picture-circle_.ant-upload-list-item-thumbnail]:!max-h-none [&_.ant-upload-list-picture-circle_.ant-upload-list-item-thumbnail]:!max-w-none",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item-thumbnail]:!rounded-full [&_.ant-upload-list-picture-circle_.ant-upload-list-item-thumbnail]:!overflow-hidden",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item-image]:!m-0 [&_.ant-upload-list-picture-circle_.ant-upload-list-item-image]:!flex [&_.ant-upload-list-picture-circle_.ant-upload-list-item-image]:!h-full [&_.ant-upload-list-picture-circle_.ant-upload-list-item-image]:!w-full [&_.ant-upload-list-picture-circle_.ant-upload-list-item-image]:!max-h-none [&_.ant-upload-list-picture-circle_.ant-upload-list-item-image]:!max-w-none",
            "[&_.ant-upload-list-picture-circle_img]:!block [&_.ant-upload-list-picture-circle_img]:!h-full [&_.ant-upload-list-picture-circle_img]:!w-full [&_.ant-upload-list-picture-circle_img]:!min-h-full [&_.ant-upload-list-picture-circle_img]:!min-w-full [&_.ant-upload-list-picture-circle_img]:!max-h-none [&_.ant-upload-list-picture-circle_img]:!max-w-none [&_.ant-upload-list-picture-circle_img]:!object-cover",
            // ไม่ให้เห็นกล่องสี่เหลี่ยมของรายการไฟล์ด้านหลังวงกลม
            "[&_.ant-upload-list]:!border-0 [&_.ant-upload-list]:!bg-transparent [&_.ant-upload-list]:!p-0 [&_.ant-upload-list]:!m-0 [&_.ant-upload-list]:!min-h-0",
            "[&_.ant-upload-list-picture-circle]:!border-0 [&_.ant-upload-list-picture-circle]:!bg-transparent",
            "[&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!border-0 [&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!bg-transparent [&_.ant-upload-list-picture-circle_.ant-upload-list-item]:!p-0",
          ].join(" ")
        : "",
    ]
      .filter(Boolean)
      .join(" ")

    const rootClass = isSettings
      ? "mx-auto flex w-full max-w-[min(252px,100%)] flex-col items-center bg-transparent py-1 text-center"
      : ["rounded-2xl border border-slate-200/90 bg-slate-50/80", "p-4 md:p-5"].join(" ")

    const rootStyle: CSSProperties | undefined = isSettings
      ? ({ "--settings-avatar": SETTINGS_AVATAR_VALUE } as CSSProperties)
      : undefined

    const titleClass = isSettings
      ? "mb-2 block w-full text-center text-sm font-medium text-slate-700"
      : "mb-3 block text-sm font-medium text-slate-700"

    const descClass = isSettings
      ? "mb-5 w-full max-w-xs text-center text-xs leading-relaxed text-slate-500"
      : "mb-4 text-xs leading-relaxed text-slate-500"

    const emptyBtnClass = [
      "flex h-full w-full flex-col items-center justify-center gap-1 rounded-full border-0 bg-transparent text-slate-500 transition-colors hover:text-teal-700",
      isSettings ? "min-h-[var(--settings-avatar)] min-w-[var(--settings-avatar)]" : "min-h-[102px] min-w-[102px]",
    ].join(" ")

    return (
      <div className={rootClass} style={rootStyle}>
        <Typography.Text className={titleClass}>รูปภาพประจำตัว</Typography.Text>
        <p className={descClass}>
          คลิกวงกลมเพื่อเลือกหรือเปลี่ยนรูป — รองรับ PNG, JPG
        </p>

        <div className={isSettings ? "flex w-full justify-center" : ""}>
          <Upload
            accept={ACCEPT}
            listType="picture-circle"
            maxCount={1}
            fileList={fileList}
            showUploadList={{ showPreviewIcon: false }}
            beforeUpload={(file) => {
              if (!isAcceptedImage(file as File)) {
                message.warning("ใช้ได้เฉพาะ PNG, JPG, หรือ WEBP")
                return Upload.LIST_IGNORE
              }
              applyFile(file as File)
              return false
            }}
            onRemove={() => {
              clearImage()
              return true
            }}
            className={uploadClassName}
          >
            {fileList.length >= 1 ? null : (
              <button type="button" className={emptyBtnClass} aria-label="เลือกรูปโปรไฟล์">
                <PlusOutlined className={isSettings ? "text-2xl" : "text-xl"} />
                <span className="text-xs font-medium">เลือกรูป</span>
              </button>
            )}
          </Upload>
        </div>
      </div>
    )
  },
)
