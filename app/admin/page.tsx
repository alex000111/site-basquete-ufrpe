import AdminPanel from "./panel";
import InstallAppButton from "./install-app-button";
export default function AdminPage(){return <><nav className="adminShortcuts"><a href="/admin/live">● Controle ao vivo</a><a href="/admin/sumula">▦ Súmula digital</a><InstallAppButton/></nav><AdminPanel/></>}
