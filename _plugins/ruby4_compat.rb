# Ruby 4.0 removed tainted?/taint/untaint which Liquid 4.x still calls.
unless Object.method_defined?(:tainted?)
  class Object
    def tainted? = false
    def taint = self
    def untaint = self
  end
end
