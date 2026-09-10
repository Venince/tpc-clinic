import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

/**
 * Drop-in replacement for a native <select>, styled to match `.input` and
 * bounded to a scrollable panel (max-h-60) instead of the browser's native
 * OS-level popup — so it never overlaps or covers fields further down the form.
 *
 * options: [{ value, label }]
 */
export default function Select({ id, value, onChange, options, placeholder = '— Select —', error, disabled }) {
    const selected = options.find(o => String(o.value) === String(value)) || null;

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <div className="relative">
                <Listbox.Button
                    id={id}
                    className={clsx(
                        'input flex items-center justify-between text-left',
                        error && 'input-error',
                        disabled && 'opacity-60 cursor-not-allowed'
                    )}
                >
                    <span className={clsx('truncate', !selected && 'text-gray-400')}>
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronUpDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </Listbox.Button>

                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className="absolute z-20 mt-1 w-full max-h-60 overflow-auto rounded-lg bg-white shadow-lg border border-gray-200 py-1 focus:outline-none">
                        {options.map(opt => (
                            <Listbox.Option
                                key={opt.value}
                                value={opt.value}
                                className={({ active }) =>
                                    clsx(
                                        'relative cursor-pointer select-none py-2 pl-9 pr-3 text-sm',
                                        active ? 'bg-clinic-50 text-clinic-900' : 'text-gray-700'
                                    )
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={clsx('block truncate', selected && 'font-medium')}>
                                            {opt.label}
                                        </span>
                                        {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-clinic-600">
                                                <CheckIcon className="w-4 h-4" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );
}