import sys
import os

def convert_model(input_path, output_path):

    print(f"Converting model: {input_path} -> {output_path}")
    
    os.environ['TF_USE_LEGACY_KERAS'] = '1'
    
    import tensorflow as tf
    print(f"TensorFlow version: {tf.__version__}")
    
    print("Loading model...")
    model = tf.keras.models.load_model(input_path, compile=False)
    print(f"Model loaded: {model.name}")
    print(f"Input shape: {model.input_shape}")
    print(f"Output shape: {model.output_shape}")
    
    print(f"Saving to: {output_path}")
    if output_path.endswith('.keras'):
        model.save(output_path)
    else:
        model.save(output_path, save_format='h5')
    
    print("Conversion complete!")
    return True


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python convert_model.py <input.h5> <output.keras>")
        print("\nThis requires TensorFlow 2.15 or earlier (with Keras 2.x)")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    if not os.path.exists(input_file):
        print(f"Error: Input file not found: {input_file}")
        sys.exit(1)
    
    try:
        convert_model(input_file, output_file)
    except Exception as e:
        print(f"Conversion failed: {e}")
        print("\nMake sure you're using TensorFlow 2.15 or earlier.")
        print("You can install it with: pip install tensorflow==2.15.0")
        sys.exit(1)
