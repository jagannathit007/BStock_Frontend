import Swal from 'sweetalert2';

interface ToastHelper {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  showTost: (message: string, type: ToastType) => void;
}
type ToastType = 'success' | 'error' | 'warning' | 'info';


const toastHelper: ToastHelper = {
  success: (message: string) => {
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });
  },

  error: (message: string) => {
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });
  },

  warning: (message: string) => {
    Swal.fire({
      icon: 'warning',
      title: 'Warning!',
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });
  },

  info: (message: string) => {
    Swal.fire({
      icon: 'info',
      title: 'Info!',
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });
  },

  showTost: (message: string, type: ToastType) => {
    // Check if it's an "Invalid credentials" error and show as warning
    let displayMessage = message;
    let displayType = type;
    
    if (type === 'error' && message.toLowerCase().includes('invalid credentials')) {
      displayMessage = 'Incorrect email or password. Please check and try again.';
      displayType = 'warning';
    }
    
    Swal.fire({
      icon: displayType,
      title: displayType.charAt(0).toUpperCase() + displayType.slice(1) + '!',
      text: displayMessage,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
};

export default toastHelper;
