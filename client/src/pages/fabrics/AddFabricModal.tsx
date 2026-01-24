import { Fragment, useRef, useState, useCallback, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  CameraIcon,
  ArrowPathIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Webcam from "react-webcam";
import Cropper, { Area, Point } from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fabricsAPI } from "@/lib/api";

interface AddFabricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFabricModal({
  isOpen,
  onClose,
}: AddFabricModalProps) {
  const [code, setCode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(
    undefined,
  );
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUIActive, setIsUIActive] = useState(true);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const queryClient = useQueryClient();

  const resetUITimer = useCallback(() => {
    setIsUIActive(true);
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    uiTimeoutRef.current = setTimeout(() => {
      setIsUIActive(false);
    }, 3000); // Fade out after 3 seconds of inactivity
  }, []);

  useEffect(() => {
    if (isCameraOpen) {
      resetUITimer();
    }
    return () => {
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [isCameraOpen, resetUITimer]);

  const pickBestCamera = useCallback((videoDevices: MediaDeviceInfo[]) => {
    // Keep original ordering preference (camera 0 should win if it's back)
    const isBack = (d: MediaDeviceInfo) =>
      ["back", "rear", "environment"].some((word) =>
        d.label.toLowerCase().includes(word),
      );

    const looksStandard = (d: MediaDeviceInfo) => {
      const label = d.label.toLowerCase();
      const bad =
        label.includes("ultra") ||
        label.includes("0.5") ||
        label.includes("0,5") ||
        label.includes("wide") ||
        label.includes("tele") ||
        label.includes("telephoto") ||
        label.includes("macro") ||
        label.includes("fisheye") ||
        label.includes("front");
      return !bad;
    };

    // 1) First back camera that looks standard (no ultra/0.5/wide/tele/macro)
    const standardBack = videoDevices.find(
      (d) => isBack(d) && looksStandard(d),
    );
    if (standardBack) return standardBack;

    // 2) First back camera in list (maintain device order; camera 0 wins)
    const firstBack = videoDevices.find(isBack);
    if (firstBack) return firstBack;

    // 3) Fallback to first available
    return videoDevices[0];
  }, []);

  const applyZoom = useCallback((zoomValue: number) => {
    setCameraZoom(zoomValue);
    const videoTrack = webcamRef.current?.video?.srcObject;
    if (videoTrack instanceof MediaStream) {
      const track = videoTrack.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (capabilities.zoom) {
        // Clamp zoom value between min and max capabilities
        const clampedZoom = Math.min(
          Math.max(zoomValue, capabilities.zoom.min || 1),
          capabilities.zoom.max || 1,
        );
        track.applyConstraints({
          advanced: [{ zoom: clampedZoom }] as any,
        });
      }
    }
  }, []);

  const handleUserMedia = useCallback(() => {
    const videoTrack = webcamRef.current?.video?.srcObject;
    if (videoTrack instanceof MediaStream) {
      const track = videoTrack.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.zoom) {
        setMaxZoom(capabilities.zoom.max || 1);
        // Default to min zoom if cameraZoom is not set or out of range
        if (cameraZoom < (capabilities.zoom.min || 1)) {
          setCameraZoom(capabilities.zoom.min || 1);
        }
      } else {
        setMaxZoom(1);
      }
    }
    // Re-apply zoom if needed
    applyZoom(cameraZoom);
  }, [cameraZoom, applyZoom]);

  useEffect(() => {
    if (!isCameraOpen) return;

    navigator.mediaDevices.enumerateDevices().then((mediaDevices) => {
      const videoDevices = mediaDevices.filter(
        ({ kind }) => kind === "videoinput",
      );

      // Filter for back cameras only to show in our lens dots
      const backCamerasList = videoDevices.filter((d) =>
        ["back", "rear", "environment"].some((word) =>
          d.label.toLowerCase().includes(word),
        ),
      );

      const currentDevices =
        backCamerasList.length > 0 ? backCamerasList : videoDevices;
      setDevices(currentDevices);

      if (videoDevices.length === 0) return;

      if (!activeDeviceId) {
        // Select the second camera in the back/filtered list (index 1) if available.
        // On many devices, index 0 is Ultrawide and index 1 is the Main lens.
        const selectedCamera =
          currentDevices.length >= 2 ? currentDevices[1] : currentDevices[0];

        if (selectedCamera) {
          console.log(
            "Auto-selecting camera based on position preference:",
            selectedCamera.label,
          );
          setActiveDeviceId(selectedCamera.deviceId);
        }
      }
    });
  }, [isCameraOpen, activeDeviceId, pickBestCamera]);

  const getLensLabel = (device: MediaDeviceInfo, index: number) => {
    const label = device.label.toLowerCase();
    if (
      label.includes("ultra") ||
      label.includes("0.5") ||
      label.includes("0,5")
    )
      return "UW";
    if (label.includes("tele") || label.includes("zoom")) return "T";
    if (
      label.includes("main") ||
      label.includes("primary") ||
      (label.includes("wide") && !label.includes("ultra"))
    )
      return "W";
    return (index + 1).toString();
  };

  // Remove the useEffect that was listening to isCameraOpen
  // as onUserMedia is safer for knowing we have permission/labels

  // Reset state when modal closes
  const handleClose = () => {
    setCode("");
    setRemarks("");
    setImage(null);
    setTempImage(null);
    setIsCameraOpen(false);
    setIsCropping(false);
    setCameraZoom(1);
    setActiveDeviceId(undefined);
    onClose();
  };

  const capture = useCallback(() => {
    // Capture at natural video resolution to avoid stretching/squashing
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setTempImage(imageSrc);
      setIsCameraOpen(false);
      setIsCropping(true);
    }
  }, [webcamRef]);

  const handleCameraError = useCallback((error: string | DOMException) => {
    console.error("Camera error:", error);

    let errorMessage = "Unable to access camera. ";

    if (error instanceof DOMException) {
      switch (error.name) {
        case "NotAllowedError":
          errorMessage +=
            "Camera permission was denied. Please allow camera access and try again.";
          break;
        case "NotFoundError":
          errorMessage += "No camera found on this device.";
          break;
        case "NotReadableError":
          errorMessage += "Camera is being used by another application. Please try again in a moment.";
          // Auto-retry after a short delay for NotReadableError
          setTimeout(() => {
            console.log("Retrying camera access after NotReadableError...");
            setIsCameraOpen(false);
            // Small delay before retrying
            setTimeout(() => setIsCameraOpen(true), 100);
          }, 1000);
          return; // Don't show error toast for auto-retry case
        case "OverconstrainedError":
          errorMessage += "Camera doesn't support the required settings.";
          break;
        case "SecurityError":
          errorMessage += "Camera access blocked due to security restrictions.";
          break;
        default:
          errorMessage += `Error: ${error.message}`;
      }
    } else {
      errorMessage += String(error);
    }

    toast.error(errorMessage);
    setIsCameraOpen(false);
  }, []);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const showCroppedImage = useCallback(async () => {
    try {
      if (tempImage && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(tempImage, croppedAreaPixels);
        setImage(croppedImage);
        setIsCropping(false);
        setTempImage(null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to crop image");
    }
  }, [tempImage, croppedAreaPixels]);

  const retake = () => {
    setImage(null);
    setTempImage(null);
    setIsCropping(false);
    setIsCameraOpen(true);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!image) throw new Error("Image is required");
      if (!code) throw new Error("Fabric code is required");

      // Convert local URL to blob
      const res = await fetch(image);
      const blob = await res.blob();
      const file = new File([blob], "fabric.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("code", code);
      formData.append("remarks", remarks);
      formData.append("image", file);

      return fabricsAPI.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fabrics"] });
      toast.success("Fabric type added successfully");
      handleClose();
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : error.response?.data?.error || "Failed to add fabric";
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting", { code, image: !!image });
    if (!image) {
      toast.error("Please capture and crop an image first");
      return;
    }
    if (!code) {
      toast.error("Please enter a fabric code");
      return;
    }
    mutation.mutate();
  };

  const videoConstraints = {
    // Ask for a moderate resolution to avoid the browser switching lenses
    width: { ideal: 1920, max: 2560 },
    height: { ideal: 1080, max: 1440 },
    // Force exact device once chosen; otherwise hint for rear camera
    ...(activeDeviceId
      ? { deviceId: { exact: activeDeviceId } }
      : { facingMode: { ideal: "environment" } }),
    // Remove fixed aspectRatio to prevent stretching
  };
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 max-h-[95vh] overflow-y-auto">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start w-full">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-semibold leading-6 text-gray-900"
                    >
                      Add New Fabric Type
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* Image Capture Section */}
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        {!isCameraOpen && !image && !isCropping && (
                          <button
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="flex flex-col items-center text-gray-500 hover:text-indigo-600"
                          >
                            <CameraIcon className="h-12 w-12 mb-2" />
                            <span className="text-sm font-medium">
                              Click to Open Camera
                            </span>
                          </button>
                        )}

                        {isCameraOpen && (
                          <div
                            className="relative w-full aspect-square overflow-hidden rounded-lg bg-black shadow-inner"
                            onTouchStart={resetUITimer}
                            onMouseMove={resetUITimer}
                            onClick={resetUITimer}
                          >
                            <Webcam
                              audio={false}
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              screenshotQuality={1}
                              minScreenshotWidth={1024}
                              videoConstraints={videoConstraints}
                              onUserMediaError={handleCameraError}
                              onUserMedia={handleUserMedia}
                              className="w-full h-full object-cover"
                              style={{ objectFit: "cover" }}
                            />

                            {/* Vertical Zoom Controls */}
                            {maxZoom > 1 && (
                              <div
                                className={`absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-opacity duration-500 bg-black/20 backdrop-blur-sm p-2 rounded-full border border-white/10 ${
                                  isUIActive
                                    ? "opacity-100"
                                    : "opacity-0 pointer-events-none"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyZoom(
                                      Math.min(cameraZoom + 0.5, maxZoom),
                                    );
                                  }}
                                  className="text-white p-1 hover:bg-white/20 rounded-full"
                                >
                                  <span className="text-lg font-bold">+</span>
                                </button>
                                <div className="h-40 flex items-center justify-center relative group">
                                  <input
                                    type="range"
                                    min="1"
                                    max={maxZoom}
                                    step="0.1"
                                    value={cameraZoom}
                                    onChange={(e) =>
                                      applyZoom(parseFloat(e.target.value))
                                    }
                                    className="h-36 w-2 bg-white/20 rounded-full appearance-none flex-col-reverse outline-none cursor-pointer accent-white"
                                    style={
                                      {
                                        WebkitAppearance: "slider-vertical",
                                      } as any
                                    }
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyZoom(Math.max(cameraZoom - 0.5, 1));
                                  }}
                                  className="text-white p-1 hover:bg-white/20 rounded-full"
                                >
                                  <span className="text-lg font-bold">−</span>
                                </button>
                                <span className="bg-white text-black text-[9px] px-1.5 py-0.5 rounded-full font-black">
                                  {cameraZoom.toFixed(1)}x
                                </span>
                              </div>
                            )}

                            {/* Lens Selector Dots (UW, W, T) */}
                            {devices.length > 1 && (
                              <div
                                className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 transition-opacity duration-500 ${
                                  isUIActive
                                    ? "opacity-100"
                                    : "opacity-0 pointer-events-none"
                                }`}
                              >
                                {devices.map((device, idx) => (
                                  <button
                                    key={device.deviceId}
                                    type="button"
                                    onClick={() =>
                                      setActiveDeviceId(device.deviceId)
                                    }
                                    className={`flex items-center justify-center transition-all ${
                                      activeDeviceId === device.deviceId
                                        ? "h-10 w-10 bg-white text-black font-bold scale-110"
                                        : "h-8 w-8 bg-black/40 text-white/70 hover:bg-black/60"
                                    } rounded-full text-[10px] uppercase shadow-lg`}
                                  >
                                    {getLensLabel(device, idx)}
                                  </button>
                                ))}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={capture}
                              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-1 shadow-2xl active:scale-95 transition-transform"
                            >
                              <div className="h-14 w-14 rounded-full border-4 border-gray-200 flex items-center justify-center">
                                <div className="h-10 w-10 rounded-full bg-red-600 ring-2 ring-offset-2 ring-red-600" />
                              </div>
                            </button>
                          </div>
                        )}

                        {isCropping && tempImage && (
                          <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                            <Cropper
                              image={tempImage}
                              crop={crop}
                              zoom={zoom}
                              aspect={1}
                              onCropChange={setCrop}
                              onCropComplete={onCropComplete}
                              onZoomChange={setZoom}
                            />
                            <div className="absolute bottom-4 left-0 right-0 p-4 flex justify-center gap-4">
                              <button
                                type="button"
                                onClick={showCroppedImage}
                                className="bg-green-600 text-white rounded-full p-3 shadow-lg hover:bg-green-700"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={retake}
                                className="bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </div>
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              Pinch to zoom / Drag to crop
                            </div>
                          </div>
                        )}

                        {image && (
                          <div className="relative w-full aspect-square">
                            <img
                              src={image}
                              alt="Captured fabric"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={retake}
                              className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-white shadow-sm"
                            >
                              <ArrowPathIcon className="h-5 w-5 text-gray-700" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Fabric Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm input"
                          placeholder="e.g. F-101"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Remarks
                        </label>
                        <textarea
                          rows={3}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base sm:text-sm input"
                          placeholder="e.g. Cotton Texture, Premium Quality"
                        />
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={mutation.isPending}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:bg-gray-400"
                        >
                          {mutation.isPending ? "Saving..." : "Save Fabric"}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={handleClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
