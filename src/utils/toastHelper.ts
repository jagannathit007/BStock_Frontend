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
    Swal.fire({
      icon: type,
      title: type.charAt(0).toUpperCase() + type.slice(1) + '!',
      text: message,
      timer: 3000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end'
    });
  }
};

export default toastHelper;
