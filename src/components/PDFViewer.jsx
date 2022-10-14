import { forwardRef, useCallback } from "react";
import PSPDFKit from "pspdfkit";
import { SignatureModal } from "./SignatureModal";
import { getSignerSignatureFieldName } from "../utils";

export const DRAG_EVENT_TYPES = {
  addDatePlaceholder: "ADD_DATE_PLACEHOLDER",
  addPlaceholderFiled: "ADD_PLACEHOLDER_FIELD",
};

const preventDefault = (e) => e.preventDefault();

const handleAddDatePlaceholder = (instance, pageIndex, { x, y }) => {
  const annotation = new PSPDFKit.Annotations.StampAnnotation({
    id: PSPDFKit.generateInstantId(),
    pageIndex,
    opacity: 0,
    stampType: "Custom",
    color: new PSPDFKit.Color({ r: 58, g: 150, b: 255 }),
    title: new Date().toLocaleString(),
    boundingBox: new PSPDFKit.Geometry.Rect({
      left: x,
      top: y,
      width: 180,
      height: 48,
    }),
  });

  instance.create(annotation);
};

const handleAddPlaceholderFiled = (
  instance,
  pageIndex,
  signer,
  showCustomUI,
  { x, y }
) => {
  const id = PSPDFKit.generateInstantId();
  const formFieldName = getSignerSignatureFieldName(signer.id, id);

  const widget = new PSPDFKit.Annotations.WidgetAnnotation({
    id,
    boundingBox: new PSPDFKit.Geometry.Rect({
      left: x,
      top: y,
      width: 180,
      height: 48,
    }),
    formFieldName,
    pageIndex,
    customData: {
      signer,
    },
  });

  const formField = new PSPDFKit.FormFields[
    showCustomUI ? "TextFormField" : "SignatureFormField"
  ]({
    name: formFieldName,
    annotationIds: PSPDFKit.Immutable.List([widget.id]),
  });

  instance.create([widget, formField]);

  return false;
};

export const PdfViewer = forwardRef(
  (
    {
      instance,
      user,
      signer,
      showCustomUI,
      dragEventType,
      signatureModalAnnotation,
      onCloseSignatureModal,
    },
    ref
  ) => {
    const handleDrop = useCallback(
      (e) => {
        (async () => {
          preventDefault(e);

          const { currentPageIndex } = instance.viewState;

          const pointInPage = await instance.transformClientToPageSpace(
            new PSPDFKit.Geometry.Point({
              x: e.clientX,
              y: e.clientY,
            }),
            currentPageIndex
          );

          switch (dragEventType) {
            case DRAG_EVENT_TYPES.addDatePlaceholder:
              return handleAddDatePlaceholder(
                instance,
                currentPageIndex,
                pointInPage
              );
            case DRAG_EVENT_TYPES.addPlaceholderFiled:
              return handleAddPlaceholderFiled(
                instance,
                currentPageIndex,
                signer,
                showCustomUI,
                pointInPage
              );
            default:
              return false;
          }
        })();
      },
      [instance, dragEventType, signer, showCustomUI]
    );

    return (
      <div
        className="pdf-instance-container"
        onDragOver={preventDefault}
        onDrop={handleDrop}
      >
        <div
          ref={ref}
          className={`pdf-instance${
            dragEventType ? " pdf-instance_events-disabled" : ""
          }`}
        />
        {signatureModalAnnotation ? (
          <SignatureModal
            instance={instance}
            user={user}
            signer={signer}
            annotation={signatureModalAnnotation}
            onClose={onCloseSignatureModal}
          />
        ) : null}
      </div>
    );
  }
);
