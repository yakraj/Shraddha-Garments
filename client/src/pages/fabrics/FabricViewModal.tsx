import { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

interface FabricViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  code: string;
}

export default function FabricViewModal({
  isOpen,
  onClose,
  imageUrl,
  code,
}: FabricViewModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Push a new state to the history when the modal opens
      window.history.pushState({ modalOpen: true }, "");

      const handlePopState = () => {
        // If the user presses back, close the modal
        onClose();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        // If the modal is closed via the X button and the state is still there, go back
        if (window.history.state?.modalOpen) {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!imageUrl) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-90 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-hidden bg-black">
          <div className="flex w-screen h-screen items-center justify-center p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-screen h-screen flex flex-col items-center justify-center">
                <div className="fixed top-4 right-4 z-[60] flex gap-4">
                  <span className="text-white text-lg font-bold bg-black/50 px-3 py-1 rounded">
                    {code}
                  </span>
                  <button
                    type="button"
                    className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-8 w-8" aria-hidden="true" />
                  </button>
                </div>

                <div className="w-full h-full flex items-center justify-center overflow-hidden bg-black">
                  <TransformWrapper
                    initialScale={1}
                    minScale={0.1}
                    maxScale={8}
                    centerOnInit
                    limitToBounds={false}
                  >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                      <Fragment>
                        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[60] flex gap-4 bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">
                          <button
                            onClick={() => zoomIn()}
                            className="bg-black/40 hover:bg-black/60 text-white w-12 h-12 flex items-center justify-center rounded-full transition-colors border border-white/10 shadow-lg"
                          >
                            <span className="text-2xl font-light">+</span>
                          </button>
                          <button
                            onClick={() => resetTransform()}
                            className="bg-black/40 hover:bg-black/60 text-white px-6 h-12 flex items-center justify-center rounded-full transition-colors text-sm font-semibold border border-white/10 shadow-lg uppercase tracking-wider"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => zoomOut()}
                            className="bg-black/40 hover:bg-black/60 text-white w-12 h-12 flex items-center justify-center rounded-full transition-colors border border-white/10 shadow-lg"
                          >
                            <span className="text-2xl font-light">-</span>
                          </button>
                        </div>
                        <TransformComponent
                          wrapperStyle={{
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            inset: 0,
                          }}
                          contentStyle={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={code}
                            className="max-h-full max-w-full object-contain"
                            style={{ width: "auto", height: "auto" }}
                          />
                        </TransformComponent>
                      </Fragment>
                    )}
                  </TransformWrapper>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
