import { useState } from "react";
import PSPDFKit from "pspdfkit";
import { getSignerSignatureFieldName } from "../utils";
import { InkInput } from "./InkInput";

const EMPTY_STORED_SIGNETURES = { text: "", ink: null };

export const SignatureModal = ({
  instance,
  annotation,
  user,
  signer,
  onClose,
}) => {
  const storedSignatureKey = getSignerSignatureFieldName(user.id);

  const [signatureMethod, setSignatureMethod] = useState(
    signer.defaultSignatureMethod
  );

  const [signatures, setSignatures] = useState(EMPTY_STORED_SIGNETURES);

  const [storedSignatures, setStoredSignatures] = useState(
    JSON.parse(localStorage.getItem(storedSignatureKey)) ||
      EMPTY_STORED_SIGNETURES
  );

  const handleChangeMethod = (e) => setSignatureMethod(e.target.value);

  const handleChangeText = (e) =>
    setSignatures((prev) => ({ ...prev, text: e.target.value }));

  const handleSaveInk = (canvasRef) =>
    setSignatures((prev) => ({
      ...prev,
      ink: canvasRef.current.toDataURL(),
    }));

  const handleStoreSignature = (value) => {
    setStoredSignatures((prev) => {
      const updatedSignatures = {
        ...prev,
        [signatureMethod]: value || signatures[signatureMethod],
      };

      localStorage.setItem(
        storedSignatureKey,
        JSON.stringify(updatedSignatures)
      );

      return updatedSignatures;
    });
  };

  const handleSubmit = async (event, storedValue) => {
    const value = storedValue || signatures[signatureMethod];

    if (!value) return;

    handleStoreSignature(value);

    const { id, pageIndex, boundingBox, customData } = annotation;
    const signerId = signer.id !== user.id ? user.id : signer.id;

    await instance.setFormFieldValues({
      [getSignerSignatureFieldName(signerId, id)]: value,
    });

    if (signatureMethod === "text") {
      const backgroundColor = new PSPDFKit.Color({ r: 240, g: 240, b: 240 });
      const borderColor = new PSPDFKit.Color({ r: 206, g: 206, b: 206 });

      const textAnnotation = new PSPDFKit.Annotations.TextAnnotation({
        pageIndex,
        boundingBox,
        customData,
        text: value,
        opacity: 0.7,
        borderStyle: "solid",
        borderColor,
        borderWidth: 1,
        backgroundColor,
        verticalAlign: "center",
        horizontalAlign: "center",
      });

      await instance.create(textAnnotation);
    }

    if (signatureMethod === "ink") {
      const res = await fetch(value);
      const blob = await res.blob();
      const imageAttachmentId = await instance.createAttachment(blob);
      const imageAnnotation = new PSPDFKit.Annotations.ImageAnnotation({
        pageIndex,
        contentType: "image/jpeg",
        imageAttachmentId,
        description: "Подпись",
        boundingBox,
      });

      await instance.create(imageAnnotation);
    }

    instance.delete(annotation);

    onClose();
  };

  return (
    <div className="signature-modal">
      <div className="signature-modal__method-select">
        <input
          type="radio"
          id="text"
          value="text"
          checked={signatureMethod === "text"}
          onChange={handleChangeMethod}
        />
        <label htmlFor="text">Текст</label>
        <input
          type="radio"
          id="ink"
          value="ink"
          checked={signatureMethod === "ink"}
          onChange={handleChangeMethod}
        />
        <label htmlFor="ink">Роспись</label>
      </div>
      {storedSignatures[signatureMethod] ? (
        <div className="signature-modal__stored-signatures">
          <span>Последняя подпись:</span>
          {signatureMethod === "text" ? (
            <span onClick={(e) => handleSubmit(e, storedSignatures.text)}>
              {storedSignatures.text}
            </span>
          ) : (
            <img
              alt="ink signature"
              src={storedSignatures.ink}
              onClick={(e) => handleSubmit(e, storedSignatures.ink)}
            />
          )}
        </div>
      ) : null}
      <div className="signature-modal__input-area">
        {signatureMethod === "text" ? (
          <input type="text" onChange={handleChangeText} />
        ) : null}
        {signatureMethod === "ink" ? <InkInput onSave={handleSaveInk} /> : null}
      </div>
      <div className="signature-modal__footer">
        <button className="button-cancel" onClick={onClose}>
          Отмена
        </button>
        <button className="button-save" onClick={handleSubmit}>
          Подписать
        </button>
      </div>
    </div>
  );
};
