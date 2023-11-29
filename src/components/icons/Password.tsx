const PasswordIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      stroke="#000"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 8.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h5.875M19 14v-2a2 2 0 1 0-4 0v2m-1 6h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1Z"
    />
    <circle cx={7.5} cy={8.5} r={1.5} fill="#000" />
    <circle cx={12} cy={8.5} r={1.5} fill="#000" />
  </svg>
);

export default PasswordIcon;
