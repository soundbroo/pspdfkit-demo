import { useEffect, useState, useRef } from "react";
import "./App.css";
import { PdfViewer, DRAG_EVENT_TYPES } from "./components/PDFViewer";

import { Placeholder } from "./components/Placeholder";

import PSPDFKit from "pspdfkit";

const WIDGET_ANNOTATION_STYLES =
  "display: flex; align-items: center; height: 100%; background: #f0f0f0; padding: 6px 12px; border-radius: 6px; opacity: 0.7; white-space: nowrap; cursor: pointer;";

const WIDGET_ANNOTATION_TEXT_STYLE =
  "overflow: hidden; text-overflow: ellipsis;";

const USERS_SELECT_OPTIONS = ["Owner", "Client1", "Client2"];

const USERS_MOCK_DATA = {
  Owner: {
    id: 1,
    fullName: "Owner",
    defaultSignatureMethod: "text",
  },
  Client1: {
    id: 2,
    fullName: "Client1",
    defaultSignatureMethod: "ink",
  },
  Client2: {
    id: 3,
    fullName: "Client2",
    defaultSignatureMethod: "text",
  },
};

const getCustomRenderers = (instance, user, setSignatureModalAnnotation) => ({
  Annotation: ({ annotation }) => {
    if (annotation instanceof PSPDFKit.Annotations.WidgetAnnotation) {
      const { id, customData } = annotation;
      const selectAnnotation = async (event) => {
        event.stopImmediatePropagation();
        setTimeout(() => instance.current.setSelectedAnnotation(id), 200);
      };

      const openSignatureModal = (event) => {
        event.stopImmediatePropagation();
        setSignatureModalAnnotation(annotation);
      };

      const node = document.createElement("div");
      const textNode = document.createElement("span");
      node.style = WIDGET_ANNOTATION_STYLES;
      textNode.style = WIDGET_ANNOTATION_TEXT_STYLE;

      const { fullName } = customData?.signer || {};

      textNode.innerText = `Подпись${fullName ? ` для ${fullName}` : ""}`;

      node.appendChild(textNode);
      node.setAttribute("data-annotation-id", id);

      if (user !== "Owner" && user !== fullName) {
        node.style.display = "none";
      }

      if (user === "Owner") {
        node.addEventListener("click", selectAnnotation);

        if (user === fullName) {
          node.addEventListener("dblclick", openSignatureModal);
        }
      } else if (user === fullName) {
        node.addEventListener("click", openSignatureModal);
      }

      return {
        node,
        append: false,
      };
    } else if (annotation instanceof PSPDFKit.Annotations.StampAnnotation) {
      const { title, color } = annotation;

      const node = document.createElement("div");
      node.style = WIDGET_ANNOTATION_STYLES;
      node.style.color = "#fff";
      node.innerText = title;

      if (color) {
        node.style.background = color.toHex();
      }

      return {
        node,
        append: true,
      };
    } else {
      return null;
    }
  },
});

function App() {
  const instance = useRef(null);
  const containerRef = useRef(null);

  const [user, setUser] = useState("Owner");
  const [signer, setSigner] = useState("Owner");
  const [showCustomUI, setShowCustomUI] = useState(true);
  const [pdfDocuments, setPDFDocuments] = useState([]);
  const [pdfDocument, setPDFDocument] = useState();
  const [dragEventType, setDragEventType] = useState(null);
  const [signatureModalAnnotation, setSignatureModalAnnotation] =
    useState(null);

  const isOwner = user === "Owner";

  const handleCloseSignatureModal = () => setSignatureModalAnnotation(null);
  const handleChangeUI = () => setShowCustomUI((prev) => !prev);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    (async function () {
      const config = {
        container,
        document: pdfDocument,
        baseUrl: `${window.location.protocol}//${window.location.host}/${process.env.PUBLIC_URL}`,
      };

      if (showCustomUI) {
        config.customRenderers = getCustomRenderers(
          instance,
          user,
          setSignatureModalAnnotation
        );
      }

      instance.current = await PSPDFKit.load(config);

      if (showCustomUI) {
        const { toolbarItems } = instance.current;

        instance.current.setToolbarItems(
          toolbarItems.filter((item) => item.type !== "signature")
        );
      }
    })();

    return () => PSPDFKit.unload(container);
  }, [pdfDocument, user, showCustomUI]);

  const handleDocumentUpload = (event) => {
    const [file] = event.target.files;
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      setPDFDocument(reader.result);
    };
  };

  const handleSelectDemoFile = () => setPDFDocument("/demo.pdf");

  const handleSelectUser = (e) => {
    const user = e.target.value;
    setUser(user);
    setSigner(user);
  };

  const handleSelectSigner = (e) => setSigner(e.target.value);

  const handleExit = () => window.location.reload();

  const handleSavePDF = async () => {
    const buffer = await instance.current.exportPDF();
    setPDFDocuments([{ name: "Сохраненный документ", buffer }]);
    setPDFDocument();
    PSPDFKit.unload(containerRef.current);
  };

  return (
    <div className="app-container">
      {!pdfDocument ? (
        <div className="login">
          <label className="user-select">
            Включить кастомный UI
            <input
              type="checkbox"
              value={showCustomUI}
              checked={showCustomUI}
              onChange={handleChangeUI}
            />
          </label>
          <label className="user-select user-select_column">
            Пользователь:
            <select value={user} onChange={handleSelectUser}>
              {USERS_SELECT_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {pdfDocuments.length ? (
            pdfDocuments.map(({ name, buffer }) => (
              <button key={name} onClick={() => setPDFDocument(buffer)}>
                {name}
              </button>
            ))
          ) : (
            <>
              <input type="file" onChange={handleDocumentUpload} />
              <button onClick={handleSelectDemoFile}>
                Использовать демо файл
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="signature-list">
            <div className="signature-list__header">Пользователь: {user}</div>
            <div className="signature-list__content">
              {isOwner && showCustomUI ? (
                <label className="user-select user-select_column">
                  Подписант:
                  <select value={signer} onChange={handleSelectSigner}>
                    {USERS_SELECT_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {isOwner ? (
                <>
                  <Placeholder
                    title="Поле для даты"
                    dragEventType={DRAG_EVENT_TYPES.addDatePlaceholder}
                    onDragChange={setDragEventType}
                  />
                  <Placeholder
                    title="Поле для подписи"
                    dragEventType={DRAG_EVENT_TYPES.addPlaceholderFiled}
                    onDragChange={setDragEventType}
                  />
                </>
              ) : null}
            </div>
            <div className="signature-list__footer">
              <button className="button-cancel" onClick={handleExit}>
                Выйти
              </button>
              <button className="button-save" onClick={handleSavePDF}>
                Сохранить
              </button>
            </div>
          </div>
          <PdfViewer
            ref={containerRef}
            instance={instance.current}
            user={USERS_MOCK_DATA[user]}
            signer={USERS_MOCK_DATA[signer]}
            showCustomUI={showCustomUI}
            dragEventType={dragEventType}
            signatureModalAnnotation={signatureModalAnnotation}
            onCloseSignatureModal={handleCloseSignatureModal}
          />
        </>
      )}
    </div>
  );
}

export default App;
