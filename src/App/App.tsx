//Imports
import TitleBar from "../ui/components/TitleBar/TitleBar"
import Sidebar from "../ui/components/Sidebar/Sidebar"
import PreviewArea from "../ui/components/PreviewArea/PreviewArea"
import Pipeline from "../ui/components/Pipeline/Pipeline"
import styles from "./App.module.css"

//Main
const App = () => {
  return (
    <div className={styles.appContainer}>
      <TitleBar />
      <div className={styles.mainContent}>
        <aside className={styles.sidebarLeft}>
          <Sidebar />
        </aside>
        <main className={styles.centerArea}>
          <PreviewArea />
        </main>
        <aside className={styles.sidebarRight}>
          <Pipeline />
        </aside>
      </div>
    </div>
  )
}

export default App
