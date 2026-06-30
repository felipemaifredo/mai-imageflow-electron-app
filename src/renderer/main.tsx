//Libs
import { StrictMode } from "react"
import ReactDOM from "react-dom/client"

//Imports
import App from "./App/App"
import "./index.css"

//Main
ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
