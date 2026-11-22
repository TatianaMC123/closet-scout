import { Panel } from "../components/ui";
import { useApp } from "../state";

export function About() {
  const { t } = useApp();
  return (
    <>
      <Panel title={t("aboutTitle")}>
        <p>{t("aboutWhat")}</p>
        <p className="cs-hint">{t("aboutAdvice")}</p>
      </Panel>
      <Panel title={t("aboutPrivacyTitle")}>
        <ul className="clean">
          <li>{t("aboutPrivacy1")}</li>
          <li>{t("aboutPrivacy2")}</li>
          <li>{t("aboutPrivacy3")}</li>
          <li>{t("aboutPrivacy4")}</li>
        </ul>
      </Panel>
      <Panel title="Vinted">
        <p>{t("aboutVinted")}</p>
      </Panel>
      <Panel title={t("installTitle")}>
        <p>{t("installIos")}</p>
      </Panel>
    </>
  );
}
