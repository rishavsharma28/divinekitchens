import { Transition } from '@headlessui/react';
import { Toaster, ToastIcon, toast, resolveValue } from 'react-hot-toast';

function TailwindToaster() {
  return (
    <Toaster>
      {(t: any) => (
        <Transition
          appear
          show={t.visible}
          className="flex transform rounded bg-white p-4 shadow-lg dark:bg-light-dark"
          enter="transition-all duration-150"
          enterFrom="opacity-0 scale-50"
          enterTo="opacity-100 scale-100"
          leave="transition-all duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-75"
        >
          <ToastIcon toast={t} />
          <p className="px-2 dark:text-white">{resolveValue(t?.message) }</p>
        </Transition>
      )}
    </Toaster>
  );
}

export default TailwindToaster;
