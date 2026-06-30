//Libs
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

//Imports
import { useToastStore } from "../../../Lib/hooks/useToastStore"
import styles from "./ToastContainer.module.css"

//Types
import type { ToastType } from "../../../Lib/hooks/useToastStore"

//Funcs
function getIcon(type: ToastType) {
  if (type === "success") {
    return <CheckCircle2 size={16} className={`${styles.icon} ${styles.iconSuccess}`} />
  }
  if (type === "error") {
    return <AlertCircle size={16} className={`${styles.icon} ${styles.iconError}`} />
  }
  return <Info size={16} className={`${styles.icon} ${styles.iconInfo}`} />
}

function getToastClass(type: ToastType) {
  if (type === "success") {
    return `${styles.toast} ${styles.toastSuccess}`
  }
  if (type === "error") {
    return `${styles.toast} ${styles.toastError}`
  }
  return `${styles.toast} ${styles.toastInfo}`
}

//Main
const ToastContainer = () => {
  let toasts = useToastStore((state) => state.toasts)
  let removeToast = useToastStore((state) => state.removeToast)

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={getToastClass(toast.type)}>
          {getIcon(toast.type)}
          <div className={styles.content}>{toast.message}</div>
          <button className={styles.closeButton} onClick={() => removeToast(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastContainer
