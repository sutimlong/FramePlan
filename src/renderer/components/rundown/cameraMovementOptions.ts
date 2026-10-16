export interface CameraMovementOption {
  value: string
  label: string
}

export interface CameraMovementGroup {
  group: string
  options: CameraMovementOption[]
}

/** 「鏡頭運動」選擇「自訂」時，下拉選單使用的內部代碼（不會與既有選項衝突） */
export const CAMERA_MOVEMENT_CUSTOM = '__custom__'

/** 取得顯示／列印用的鏡頭運動文字：選「自訂」時回傳輸入文字，否則回傳選項本身 */
export function cameraMovementText(cameraMovement: string, customCameraMovement: string | undefined): string {
  return cameraMovement === CAMERA_MOVEMENT_CUSTOM ? (customCameraMovement ?? '') : cameraMovement
}

export const CAMERA_MOVEMENT_GROUPS: ReadonlyArray<CameraMovementGroup> = [
  {
    group: '靜態景別',
    options: [
      { value: '大遠景 (ELS)', label: '大遠景 (ELS)' },
      { value: '遠景 (LS)', label: '遠景 (LS)' },
      { value: '全景 (FS)', label: '全景 (FS)' },
      { value: '中遠景 (MLS)', label: '中遠景 (MLS)' },
      { value: '中景 (MS)', label: '中景 (MS)' },
      { value: '中特寫 (MCU)', label: '中特寫 (MCU)' },
      { value: '特寫 (CU)', label: '特寫 (CU)' },
      { value: '大特寫 (ECU)', label: '大特寫 (ECU)' },
    ],
  },
  {
    group: '動態景別 / 運鏡',
    options: [
      { value: '橫搖 (Pan)', label: '橫搖 (Pan)' },
      { value: '直搖 (Tilt)', label: '直搖 (Tilt)' },
      { value: '推軌 (Dolly)', label: '推軌 (Dolly)' },
      { value: '平移 (Truck)', label: '平移 (Truck)' },
      { value: '升降 (Pedestal)', label: '升降 (Pedestal)' },
      { value: '搖臂 (Crane)', label: '搖臂 (Crane)' },
      { value: '跟鏡 (Steadicam)', label: '跟鏡 (Steadicam)' },
      { value: '環繞 (Arc Shot)', label: '環繞 (Arc Shot)' },
      { value: '手持 (Handheld)', label: '手持 (Handheld)' },
      { value: '變焦 (Zoom)', label: '變焦 (Zoom)' },
      { value: '滑動變焦 (Dolly Zoom)', label: '滑動變焦 (Dolly Zoom)' },
    ],
  },
  {
    group: '攝影角度',
    options: [
      { value: '平視角 (Eye Level)', label: '平視角 (Eye Level)' },
      { value: '俯角 (High Angle)', label: '俯角 (High Angle)' },
      { value: '仰角 (Low Angle)', label: '仰角 (Low Angle)' },
      { value: '鳥瞰角 (Top Shot)', label: '鳥瞰角 (Top Shot)' },
      { value: '傾斜角 (Dutch Angle)', label: '傾斜角 (Dutch Angle)' },
    ],
  },
  {
    group: '其他',
    options: [{ value: CAMERA_MOVEMENT_CUSTOM, label: '自訂' }],
  },
]
