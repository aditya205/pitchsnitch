import { cn } from "@/lib/cn";

type BrandBackdropProps = {
  className?: string;
};

export function BrandBackdrop({ className }: BrandBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 hidden overflow-hidden text-accent sm:block",
        className
      )}
    >
      <svg
        viewBox="0 0 1280 980"
        preserveAspectRatio="xMidYMin slice"
        className="absolute inset-0 h-full min-h-[900px] w-full opacity-30"
        fill="none"
      >
        <defs>
          <pattern
            id="brand-iso-grid"
            width="112"
            height="56"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 56 112 0M0 0l112 56"
              stroke="currentColor"
              strokeOpacity="0.26"
              strokeWidth="1"
            />
          </pattern>

          <g id="brand-iso-forms">
            <g>
              <polygon
                points="190,82 260,46 330,82 260,118"
                fill="currentColor"
                opacity="0.07"
              />
              <polygon
                points="190,82 260,118 260,176 190,140"
                fill="currentColor"
                opacity="0.12"
              />
              <polygon
                points="260,118 330,82 330,140 260,176"
                fill="currentColor"
                opacity="0.18"
              />
              <path d="M190 82 260 46 330 82 260 118 190 82v58l70 36 70-36V82" />
            </g>

            <g>
              <polygon
                points="522,92 572,67 622,92 572,117"
                fill="currentColor"
                opacity="0.07"
              />
              <polygon
                points="522,92 572,117 572,164 522,139"
                fill="currentColor"
                opacity="0.12"
              />
              <polygon
                points="572,117 622,92 622,139 572,164"
                fill="currentColor"
                opacity="0.18"
              />
              <path d="M522 92 572 67 622 92 572 117 522 92v47l50 25 50-25V92" />
            </g>

            <g>
              <polygon
                points="792,70 862,35 932,70 862,105"
                fill="currentColor"
                opacity="0.07"
              />
              <polygon
                points="792,70 862,105 862,168 792,133"
                fill="currentColor"
                opacity="0.12"
              />
              <polygon
                points="862,105 932,70 932,133 862,168"
                fill="currentColor"
                opacity="0.18"
              />
              <path d="M792 70 862 35 932 70 862 105 792 70v63l70 35 70-35V70" />
              <path d="M816 91 862 114 908 91" opacity="0.55" />
              <path d="M816 112 862 135 908 112" opacity="0.55" />
            </g>

            <g>
              <polygon
                points="1038,118 1088,93 1138,118 1088,143"
                fill="currentColor"
                opacity="0.07"
              />
              <polygon
                points="1038,118 1088,143 1088,188 1038,163"
                fill="currentColor"
                opacity="0.12"
              />
              <polygon
                points="1088,143 1138,118 1138,163 1088,188"
                fill="currentColor"
                opacity="0.18"
              />
              <path d="M1038 118 1088 93 1138 118 1088 143 1038 118v45l50 25 50-25v-45" />
            </g>

            <g>
              <path d="M406 178 456 153 506 178 456 203 406 178Z" />
              <path d="M406 178v16l50 25 50-25v-16" />
              <path d="M406 198 456 223 506 198" />
              <path d="M406 218 456 243 506 218" />
            </g>

            <g>
              <path d="M662 184 720 155 778 184 720 213 662 184Z" />
              <path d="M720 155v-60" />
              <path d="M720 95 760 75 800 95v86l-40 20-40-20V95Z" />
              <path d="M760 75v86" />
              <path d="M744 104h7M759 97h7M774 90h7M744 118h7M759 111h7M774 104h7" />
            </g>
          </g>
        </defs>

        <rect width="1280" height="980" fill="url(#brand-iso-grid)" />

        <g stroke="currentColor" strokeLinejoin="round" strokeWidth="1.15">
          <use href="#brand-iso-forms" />
          <use
            href="#brand-iso-forms"
            opacity="0.72"
            transform="translate(-118 318) scale(0.88)"
          />
          <use
            href="#brand-iso-forms"
            opacity="0.55"
            transform="translate(94 626) scale(0.76)"
          />
        </g>
      </svg>
    </div>
  );
}
